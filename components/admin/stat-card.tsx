"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Users, 
  Monitor, 
  Gamepad2, 
  TrendingUp, 
  Star, 
  Heart,
  Database,
  Activity,
  Calendar
} from "lucide-react"
import { cn } from "@/lib/utils"

const iconMap = {
  Users,
  Monitor,
  Gamepad2,
  TrendingUp,
  Star,
  Heart,
  Database,
  Activity,
  Calendar
} as const

type IconName = keyof typeof iconMap

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: IconName
  trend?: {
    value: number
    label: string
    positive?: boolean
  }
  className?: string
}

export function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  const Icon = icon ? iconMap[icon] : null
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="text-xs text-muted-foreground">
            {description}
          </CardDescription>
        )}
        {trend && (
          <div className="flex items-center pt-1">
            <span
              className={cn(
                "text-xs font-medium",
                trend.positive !== false ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}
            >
              {trend.positive !== false ? "+" : ""}{trend.value}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}