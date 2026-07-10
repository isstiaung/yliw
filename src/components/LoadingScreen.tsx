export default function LoadingScreen({ message = 'Preparing your calendar…' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] paper-grain flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-5 flex w-fit gap-1.5" aria-hidden="true">
          {Array.from({ length: 7 }, (_, i) => (
            <div
              key={i}
              className="loader-week h-3 w-3 rounded-[2px]"
              style={{ animationDelay: `${i * 0.12}s`, background: 'var(--week-future)' }}
            />
          ))}
        </div>
        <p className="text-sm tracking-wide text-[var(--muted)]">{message}</p>
      </div>
    </div>
  );
}
