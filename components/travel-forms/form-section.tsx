"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  step?: number
  totalSteps?: number
  icon?: React.ElementType
}

export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children,
  className,
  step,
  totalSteps,
  icon: Icon
}) => {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="space-y-2">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-primary" />}
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {title}
              {step && totalSteps && (
                <span className="text-sm font-normal text-muted-foreground">
                  Step {step} of {totalSteps}
                </span>
              )}
            </CardTitle>
            {description && (
              <CardDescription className="mt-1">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
} 