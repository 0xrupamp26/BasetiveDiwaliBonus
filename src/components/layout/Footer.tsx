export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {currentYear} Basetive Diwali Bonus. All rights reserved.
        </p>
        <div className="flex items-center space-x-6 text-sm text-muted-foreground">
          <a
            href="#"
            className="transition-colors hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms
          </a>
          <a
            href="#"
            className="transition-colors hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy
          </a>
          <a
            href="#"
            className="transition-colors hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </a>
        </div>
      </div>
    </footer>
  );
}
