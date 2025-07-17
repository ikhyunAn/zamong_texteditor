'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Global Error</h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>Something went wrong!</p>
            <button
              onClick={() => reset()}
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '0.375rem', 
                cursor: 'pointer' 
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
