"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Copy, ExternalLink } from "lucide-react"

export function SetupInstructions() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-[#1f5582] mb-2">Setup Instructions</h1>
          <p className="text-gray-600">Configure your environment to get started with Trypto</p>
        </motion.div>

        <div className="grid gap-6">
          {/* Security Warning */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle className="h-5 w-5" />
                  Security Notice
                </CardTitle>
              </CardHeader>
              <CardContent className="text-amber-700">
                <p className="mb-2">
                  <strong>Important:</strong> Never share API keys in chat, code repositories, or public spaces.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Always use environment variables for sensitive data</li>
                  <li>Add .env.local to your .gitignore file</li>
                  <li>Use different keys for development and production</li>
                  <li>Rotate keys regularly for security</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Environment Setup */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Environment Variables Setup
                </CardTitle>
                <CardDescription>Create a .env.local file in your project root</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-green-400"># .env.local</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`# OpenAI API Key for AI-powered features
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Unsplash API Key for location images
UNSPLASH_ACCESS_KEY=your_unsplash_api_key_here`)
                      }
                      className="text-gray-400 hover:text-white h-6 px-2"
                    >
                      {copied ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-blue-400"># OpenAI API Key for AI-powered features</span>
                    </div>
                    <div>
                      <span className="text-yellow-400">OPENAI_API_KEY</span>
                      <span className="text-white">=</span>
                      <span className="text-green-400">your_openai_api_key_here</span>
                    </div>
                    <div className="mt-2">
                      <span className="text-blue-400"># Optional: Unsplash API Key for location images</span>
                    </div>
                    <div>
                      <span className="text-yellow-400">UNSPLASH_ACCESS_KEY</span>
                      <span className="text-white">=</span>
                      <span className="text-green-400">your_unsplash_api_key_here</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* API Key Management */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>API Key Management</CardTitle>
                <CardDescription>How to properly handle your OpenAI API key</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-700">✅ Do This</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Store in environment variables</li>
                      <li>• Use .env.local for local development</li>
                      <li>• Add to Vercel environment settings</li>
                      <li>• Keep keys private and secure</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-700">❌ Don't Do This</h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Hardcode in source code</li>
                      <li>• Share in chat or email</li>
                      <li>• Commit to version control</li>
                      <li>• Use in client-side code</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Quick Setup Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Create a .env.local file in your project root</li>
                    <li>Add your OpenAI API key to the file</li>
                    <li>Restart your development server</li>
                    <li>Test the AI features</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Deployment */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Deployment on Vercel</CardTitle>
                <CardDescription>Configure environment variables for production</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    1
                  </Badge>
                  <div>
                    <p className="font-medium">Connect Repository</p>
                    <p className="text-sm text-gray-600">Link your GitHub repository to Vercel</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    2
                  </Badge>
                  <div>
                    <p className="font-medium">Add Environment Variables</p>
                    <p className="text-sm text-gray-600">
                      Go to Project Settings → Environment Variables in Vercel dashboard
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">
                    3
                  </Badge>
                  <div>
                    <p className="font-medium">Deploy</p>
                    <p className="text-sm text-gray-600">Push to main branch for automatic deployment</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="outline" className="w-full" asChild>
                    <a
                      href="https://vercel.com/docs/projects/environment-variables"
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Vercel Environment Variables Guide
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Features Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Features Enabled by API Keys</CardTitle>
                <CardDescription>What functionality requires which API keys</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Badge className="bg-[#1f5582]">Required</Badge>
                      OpenAI API Key
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• AI-powered request form conversations</li>
                      <li>• Smart data extraction from chat</li>
                      <li>• Itinerary chat assistant</li>
                      <li>• Travel recommendations</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Badge variant="secondary">Optional</Badge>
                      Unsplash API Key
                    </h4>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>• Dynamic location images</li>
                      <li>• Enhanced visual experience</li>
                      <li>• Falls back to verified images</li>
                      <li>• App works without this key</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
