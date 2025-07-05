import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
  trend?: string;
  trendUp?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendUp,
  onClick,
  clickable = false
}: StatsCardProps) {
  return (
    <Card 
      className={`bg-slate-800 border-slate-700 ${clickable ? 'cursor-pointer hover:bg-slate-700 transition-colors' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-300">{title}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBg.replace('bg-', 'bg-').replace('-100', '-600/20')} rounded-lg flex items-center justify-center border border-slate-600`}>
            <Icon className={`${iconColor.replace('text-', 'text-')} text-xl w-6 h-6`} />
          </div>
        </div>
        {trend && (
          <p className="text-sm text-gray-400 mt-2">
            <span className={`font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {trend}
            </span>
          </p>
        )}
        {clickable && (
          <div className="mt-2 text-xs text-cyan-400 font-medium">
            Click to view details →
          </div>
        )}
      </CardContent>
    </Card>
  );
}
