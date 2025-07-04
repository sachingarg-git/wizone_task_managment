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
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  trendUp
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
            <Icon className={`${iconColor} text-xl w-6 h-6`} />
          </div>
        </div>
        {trend && (
          <p className="text-sm text-gray-500 mt-2">
            <span className={`font-medium ${trendUp ? 'text-success' : 'text-error'}`}>
              {trend}
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
