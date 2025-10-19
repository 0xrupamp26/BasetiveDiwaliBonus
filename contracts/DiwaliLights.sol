// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

interface IAIOracle {
    function requestAIResponse(string memory prompt) external payable returns (bytes32);
    function getAIResponse(bytes32 requestId) external view returns (string memory);
    function fee() external view returns (uint256);
}

contract BasetiveDiwaliBonus is Ownable, ReentrancyGuard, Pausable {
    IAIOracle public aiOracle;
    IERC20 public rewardToken;

    // Reward system
    uint256 public baseRewardAmount = 1e18; // 1 token base reward
    uint256 public bonusMultiplier = 2; // 2x multiplier for high scores

    // Submission limits
    uint256 public maxSubmissionsPerUser = 5;
    uint256 public cooldownPeriod = 1 hours;
    uint256 public votingPeriod = 7 days;
    uint256 public maxSubmissions = 10000; // Circuit breaker

    // Submission states
    enum SubmissionStatus { Pending, Scored, Voting, Completed }

    struct Submission {
        address submitter;
        string imageUrl;
        string ipfsHash;
        uint8 aiScore;
        uint256 totalVotes;
        uint256 timestamp;
        SubmissionStatus status;
        bool rewarded;
        uint256 rewardAmount;
    }

    struct Vote {
        address voter;
        uint8 score;
        uint256 timestamp;
    }

    // State variables
    mapping(bytes32 => string) public submissionRequests; // requestId => imageUrl
    mapping(string => Submission) public submissions; // imageUrl => Submission
    mapping(address => uint256) public lastSubmissionTime; // user => timestamp
    mapping(address => uint256[]) public userSubmissions; // user => submission indices
    mapping(string => Vote[]) public submissionVotes; // imageUrl => votes
    mapping(address => mapping(string => bool)) public hasVoted; // voter => imageUrl => voted

    // Arrays for enumeration
    string[] public submissionKeys;
    string[] public activeSubmissions;

    // Statistics
    uint256 public totalSubmissions;
    uint256 public totalRewardsDistributed;
    uint256 public totalVotesCast;

    // Events
    event SubmissionCreated(bytes32 indexed requestId, address indexed submitter, string imageUrl, string ipfsHash);
    event SubmissionScored(bytes32 indexed requestId, address indexed submitter, string imageUrl, uint8 aiScore);
    event VoteCast(address indexed voter, string imageUrl, uint8 score);
    event RewardDistributed(address indexed recipient, uint256 amount, string imageUrl);
    event SubmissionStatusUpdated(string imageUrl, SubmissionStatus status);

    constructor(
        address _aiOracleAddress,
        address _rewardTokenAddress,
        uint256 _baseRewardAmount
    ) Ownable(msg.sender) {
        aiOracle = IAIOracle(_aiOracleAddress);
        rewardToken = IERC20(_rewardTokenAddress);
        baseRewardAmount = _baseRewardAmount;
    }

    // Main submission function
    function submitDiwaliLights(
        string memory imageUrl,
        string memory ipfsHash
    ) external payable nonReentrant whenNotPaused {
        require(totalSubmissions < maxSubmissions, "Maximum submissions reached");
        require(block.timestamp - lastSubmissionTime[msg.sender] >= cooldownPeriod, "Cooldown period not passed");
        require(userSubmissions[msg.sender].length < maxSubmissionsPerUser, "Max submissions per user reached");

        uint256 oracleFee = aiOracle.fee();
        require(msg.value >= oracleFee, "Insufficient fee for AI oracle");

        // Create AI scoring prompt
        string memory prompt = string(
            abi.encodePacked(
                "Image URL: ", imageUrl, "\n",
                "IPFS Hash: ", ipfsHash, "\n",
                "Task: Score the Diwali lights and festivity in this image\n",
                "Scale: 1 to 10 (1 = minimal/no Diwali elements, 10 = excellent Diwali spirit with lights/decorations)\n",
                "Instructions: Respond with ONLY a single number between 1-10"
            )
        );

        bytes32 requestId = aiOracle.requestAIResponse{value: oracleFee}(prompt);
        submissionRequests[requestId] = imageUrl;
        lastSubmissionTime[msg.sender] = block.timestamp;

        emit SubmissionCreated(requestId, msg.sender, imageUrl, ipfsHash);
    }

    // Process AI scoring result
    function processAIScore(bytes32 requestId) external nonReentrant {
        string memory response = aiOracle.getAIResponse(requestId);
        require(bytes(response).length > 0, "No response from oracle");

        string memory imageUrl = submissionRequests[requestId];
        require(bytes(imageUrl).length > 0, "Invalid request ID");

        uint8 aiScore = uint8(bytes1(bytes(response))) - 48; // Convert ASCII to number
        require(aiScore >= 1 && aiScore <= 10, "Invalid AI score");

        // Update submission
        submissions[imageUrl].aiScore = aiScore;
        submissions[imageUrl].status = SubmissionStatus.Scored;
        submissions[imageUrl].timestamp = block.timestamp;

        // Add to active submissions for voting
        activeSubmissions.push(imageUrl);

        emit SubmissionScored(requestId, msg.sender, imageUrl, aiScore);
        emit SubmissionStatusUpdated(imageUrl, SubmissionStatus.Scored);
    }

    // Community voting system
    function voteOnSubmission(
        string memory imageUrl,
        uint8 score
    ) external nonReentrant {
        require(submissions[imageUrl].status == SubmissionStatus.Scored, "Submission not ready for voting");
        require(!hasVoted[msg.sender][imageUrl], "Already voted on this submission");
        require(score >= 1 && score <= 10, "Invalid vote score");

        submissions[imageUrl].totalVotes += score;
        submissionVotes[imageUrl].push(Vote({
            voter: msg.sender,
            score: score,
            timestamp: block.timestamp
        }));

        hasVoted[msg.sender][imageUrl] = true;
        totalVotesCast++;

        emit VoteCast(msg.sender, imageUrl, score);
    }

    // Batch voting for efficiency
    function batchVote(
        string[] memory imageUrls,
        uint8[] memory scores
    ) external nonReentrant {
        require(imageUrls.length == scores.length, "Arrays length mismatch");
        require(imageUrls.length <= 20, "Batch too large"); // Gas limit protection

        for (uint256 i = 0; i < imageUrls.length; i++) {
            if (submissions[imageUrls[i]].status == SubmissionStatus.Scored &&
                !hasVoted[msg.sender][imageUrls[i]] &&
                scores[i] >= 1 && scores[i] <= 10) {

                submissions[imageUrls[i]].totalVotes += scores[i];
                submissionVotes[imageUrls[i]].push(Vote({
                    voter: msg.sender,
                    score: scores[i],
                    timestamp: block.timestamp
                }));

                hasVoted[msg.sender][imageUrls[i]] = true;
                totalVotesCast++;

                emit VoteCast(msg.sender, imageUrls[i], scores[i]);
            }
        }
    }

    // Calculate and distribute rewards
    function calculateAndDistributeRewards(string memory imageUrl) external nonReentrant {
        Submission storage submission = submissions[imageUrl];
        require(submission.status == SubmissionStatus.Scored, "Submission not scored");
        require(!submission.rewarded, "Already rewarded");
        require(block.timestamp >= submission.timestamp + votingPeriod, "Voting period not ended");

        // Calculate final score (AI + Community)
        uint256 communityScore = submissionVotes[imageUrl].length > 0 ?
            submission.totalVotes / submissionVotes[imageUrl].length : 0;

        uint256 finalScore = (uint256(submission.aiScore) * 60 + communityScore * 40) / 100;

        // Determine reward amount based on score
        uint256 rewardAmount;
        if (finalScore >= 8) {
            rewardAmount = baseRewardAmount * bonusMultiplier; // High tier
        } else if (finalScore >= 6) {
            rewardAmount = baseRewardAmount * 3 / 2; // Medium tier
        } else if (finalScore >= 4) {
            rewardAmount = baseRewardAmount; // Base tier
        } else {
            rewardAmount = 0; // No reward
        }

        if (rewardAmount > 0) {
            submission.rewarded = true;
            submission.rewardAmount = rewardAmount;
            submission.status = SubmissionStatus.Completed;

            require(rewardToken.transfer(submission.submitter, rewardAmount), "Token transfer failed");
            totalRewardsDistributed += rewardAmount;

            emit RewardDistributed(submission.submitter, rewardAmount, imageUrl);
        }

        emit SubmissionStatusUpdated(imageUrl, SubmissionStatus.Completed);
    }

    // Batch reward distribution
    function batchDistributeRewards(string[] memory imageUrls) external nonReentrant {
        require(imageUrls.length <= 50, "Batch too large");

        for (uint256 i = 0; i < imageUrls.length; i++) {
            if (submissions[imageUrls[i]].status == SubmissionStatus.Scored &&
                !submissions[imageUrls[i]].rewarded &&
                block.timestamp >= submissions[imageUrls[i]].timestamp + votingPeriod) {

                // Simplified reward calculation for batch processing
                uint256 rewardAmount = submissions[imageUrls[i]].aiScore >= 6 ?
                    baseRewardAmount : (submissions[imageUrls[i]].aiScore >= 4 ? baseRewardAmount / 2 : 0);

                if (rewardAmount > 0) {
                    submissions[imageUrls[i]].rewarded = true;
                    submissions[imageUrls[i]].rewardAmount = rewardAmount;
                    submissions[imageUrls[i]].status = SubmissionStatus.Completed;

                    require(rewardToken.transfer(submissions[imageUrls[i]].submitter, rewardAmount), "Token transfer failed");
                    totalRewardsDistributed += rewardAmount;

                    emit RewardDistributed(submissions[imageUrls[i]].submitter, rewardAmount, imageUrls[i]);
                    emit SubmissionStatusUpdated(imageUrls[i], SubmissionStatus.Completed);
                }
            }
        }
    }

    // View functions for frontend
    function getSubmission(string memory imageUrl) external view returns (Submission memory) {
        return submissions[imageUrl];
    }

    function getUserSubmissions(address user) external view returns (string[] memory) {
        return _getUserSubmissions(user);
    }

    function getActiveSubmissions() external view returns (string[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < activeSubmissions.length; i++) {
            if (submissions[activeSubmissions[i]].status == SubmissionStatus.Scored) {
                count++;
            }
        }

        string[] memory result = new string[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < activeSubmissions.length; i++) {
            if (submissions[activeSubmissions[i]].status == SubmissionStatus.Scored) {
                result[index] = activeSubmissions[i];
                index++;
            }
        }

        return result;
    }

    function getSubmissionVotes(string memory imageUrl) external view returns (Vote[] memory) {
        return submissionVotes[imageUrl];
    }

    function getUserStats(address user) external view returns (
        uint256 submissionsCount,
        uint256 totalRewards,
        uint256 averageScore
    ) {
        string[] memory userSubs = _getUserSubmissions(user);
        submissionsCount = userSubs.length;

        uint256 totalScore = 0;
        for (uint256 i = 0; i < userSubs.length; i++) {
            if (submissions[userSubs[i]].rewarded) {
                totalRewards += submissions[userSubs[i]].rewardAmount;
            }
            totalScore += submissions[userSubs[i]].aiScore;
        }

        averageScore = submissionsCount > 0 ? totalScore / submissionsCount : 0;
    }

    // Internal helper function
    function _getUserSubmissions(address user) internal view returns (string[] memory) {
        return userSubmissions[user];
    }

    // Admin functions
    function updateRewardParameters(
        uint256 _baseRewardAmount,
        uint256 _bonusMultiplier
    ) external onlyOwner {
        baseRewardAmount = _baseRewardAmount;
        bonusMultiplier = _bonusMultiplier;
    }

    function updateSubmissionLimits(
        uint256 _maxSubmissionsPerUser,
        uint256 _cooldownPeriod,
        uint256 _votingPeriod
    ) external onlyOwner {
        maxSubmissionsPerUser = _maxSubmissionsPerUser;
        cooldownPeriod = _cooldownPeriod;
        votingPeriod = _votingPeriod;
    }

    function setMaxSubmissions(uint256 _maxSubmissions) external onlyOwner {
        maxSubmissions = _maxSubmissions;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function withdrawTokens(address tokenAddress) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(balance > 0, "No tokens to withdraw");
        require(token.transfer(owner(), balance), "Token transfer failed");
    }

    // Fallback function to receive ETH for oracle fees
    receive() external payable {}
}
