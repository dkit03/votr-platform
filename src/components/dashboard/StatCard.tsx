interface StatCardProps {
    label: string;
    value: string;
    sublabel?: string;
    highlight?: boolean;
    valueClassName?: string;
}

export function StatCard({ label, value, sublabel, highlight, valueClassName }: StatCardProps) {
    return (
        <div className={`
            rounded-2xl p-5 transition-all duration-200
            ${highlight
                ? 'bg-gradient-to-br from-votr-gold/10 to-votr-gold/5 border border-votr-gold/20'
                : 'glass-card'
            }
        `}>
            <p className="text-votr-text-muted text-xs uppercase tracking-wider mb-2">
                {label}
            </p>
            <p className={`text-2xl font-bold ${valueClassName || (highlight ? 'text-votr-gold' : 'text-white')}`}>
                {value}
            </p>
            {sublabel && (
                <p className="text-votr-text-muted text-xs mt-1">
                    {sublabel}
                </p>
            )}
        </div>
    );
}
