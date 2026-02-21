'use client';

interface ErrorScreenProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center animate-scale-bounce">
            <div className="text-6xl mb-4">😕</div>
            <h1 className="text-2xl font-bold mb-2">
                Oops!
            </h1>
            <p className="text-votr-text-muted mb-6 max-w-xs">
                {message}
            </p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-8 py-3 rounded-2xl bg-votr-gold text-votr-dark font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
