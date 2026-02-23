import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BaseCardProps<T = any> {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  footer?: React.ReactNode
  children?: React.ReactNode
  className?: string
  headerClassName?: string
  titleClassName?: string
  descriptionClassName?: string
  contentClassName?: string
  withPadding?: boolean
  data?: T
}

export function BaseCard({
  title,
  description,
  action,
  footer,
  children,
  className,
  headerClassName,
  titleClassName,
  descriptionClassName,
  contentClassName,
  withPadding = true,
  data,
}: BaseCardProps) {
  const showHeader = title || description || action

  return (
    <Card className={cn(className)}>
      {showHeader && (
        <CardHeader className={cn("flex flex-row items-center justify-between space-y-0 pb-2", headerClassName)}>
          <div className="flex flex-col space-y-1.5">
            {title && (
              <CardTitle className={cn(titleClassName)}>
                {title}
              </CardTitle>
            )}
            {description && (
              <CardDescription className={cn(descriptionClassName)}>
                {description}
              </CardDescription>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </CardHeader>
      )}
      {withPadding ? (
        <CardContent className={cn(contentClassName)}>
          {children}
        </CardContent>
      ) : (
        <>
            {children}
        </>
      )}
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  )
}
