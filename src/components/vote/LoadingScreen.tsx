'use client';

interface LoadingScreenProps {
    message?: string;
}

export function LoadingScreen({ message }: LoadingScreenProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
            {/* Animated loader */}
            <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 rounded-full border-2 border-votr-gold/20"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-votr-gold animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-votr-red animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
            </div>
            <p className="text-votr-text-muted text-sm">
                {message || 'Loading...'}
            </p>
        </div>
    );
}
