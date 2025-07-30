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
      className={`bg-white border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 ${clickable ? 'cursor-pointer hover:shadow-lg hover:border-gray-300' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBg.replace('/20', '/10')} rounded-lg flex items-center justify-center border border-gray-100 shadow-sm`}>
            <Icon className={`${iconColor} text-xl w-6 h-6`} />
          </div>
        </div>
        {trend && (
          <p className="text-sm text-gray-500 mt-2">
            <span className={`font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
              {trend}
            </span>
          </p>
        )}
        {clickable && (
          <div className="mt-2 text-xs text-blue-500 font-medium">
            Click to view details →
          </div>
        )}
      </CardContent>
    </Card>
  );
}
