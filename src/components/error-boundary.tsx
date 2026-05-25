"use client"

import { Component, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  handleReload = () => {
    this.setState({ hasError: false })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Terjadi Kesalahan</h2>
              <p className="text-muted-foreground text-sm mb-4">
                {this.state.error?.message || "Terjadi kesalahan yang tidak terduga."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" onClick={this.handleReload}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Muat Ulang
                </Button>
                <Link href="/dashboard">
                  <Button variant="back">
                    <Home className="w-4 h-4 mr-2" />
                    Kembali ke Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}