export default function LoadingScreen({ message = 'Loading your life calendar…' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--accent)]" />
        <p className="text-sm tracking-wide text-[var(--muted)]">{message}</p>
      </div>
    </div>
  );
}
