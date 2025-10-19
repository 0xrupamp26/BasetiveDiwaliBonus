'use client';

import { useAccount } from 'wagmi';
import Link from 'next/link';
import { Button } from '~/components/ui/Button';
import { Sparkles, Camera, Award } from 'lucide-react';
import { ConnectButton } from '~/components/wallet/ConnectButton';

export function Home() {
  const { isConnected } = useAccount();

  return (
    <div className="container relative pb-10">
      {/* Hero Section */}
      <section className="space-y-6 pb-8 pt-6 md:pb-12 md:pt-10 lg:py-32">
        <div className="container flex max-w-[64rem] flex-col items-center gap-4 text-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#0052ff] via-[#2ea0ff] to-[#f59e0b] rounded-full opacity-30 blur-xl"></div>
            <h1 className="relative z-10 bg-gradient-to-r from-[#0052ff] via-[#2ea0ff] to-[#f59e0b] bg-clip-text text-4xl font-bold text-transparent sm:text-5xl md:text-6xl lg:text-7xl">
              BasetiveDiwaliBonus
            </h1>
          </div>
          <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8">
            Capture the magic of Diwali, share your brightest moments, and earn crypto rewards for your festive spirit!
          </p>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            <Link href="/submit">
              <Button>
                <Sparkles className="mr-2 h-5 w-5" />
                Submit Your Photo
              </Button>
            </Link>
            <Link href="/gallery">
              <Button>
                <Camera className="mr-2 h-5 w-5" />
                View Gallery
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container space-y-6 bg-slate-50 py-8 dark:bg-transparent md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            How It Works
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Join the Diwali celebration in just a few simple steps
          </p>
        </div>
        <div className="mx-auto grid justify-center gap-4 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3">
          {[
            {
              icon: <Camera className="h-10 w-10" />,
              title: "1. Capture",
              description: "Take a photo of your Diwali decorations, diyas, or celebrations"
            },
            {
              icon: <Sparkles className="h-10 w-10" />,
              title: "2. Submit",
              description: "Upload your photo and connect your wallet to enter the contest"
            },
            {
              icon: <Award className="h-10 w-10" />,
              title: "3. Earn",
              description: "Get rewarded with crypto if your photo captures the Diwali spirit!"
            }
          ].map((feature, index) => (
            <div key={index} className="relative overflow-hidden rounded-lg border bg-background p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-yellow-100 text-yellow-500">
                {feature.icon}
              </div>
              <div className="mt-4">
                <h3 className="font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container flex flex-col items-center gap-4 py-8 md:py-12 lg:py-24">
        <div className="mx-auto flex max-w-[58rem] flex-col items-center space-y-4 text-center">
          <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-4xl">
            Ready to join the celebration?
          </h2>
          <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
            Connect your wallet and start sharing your Diwali moments today!
          </p>
          {!isConnected ? (
            <div className="mt-4">
              <ConnectButton />
            </div>
          ) : (
            <Link href="/submit" className="mt-4">
              <Button className="bg-yellow-500 hover:bg-yellow-600">Start Uploading</Button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
