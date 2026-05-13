"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Zap, Globe, Heart } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [selectedRadio, setSelectedRadio] = useState("option1");

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-base p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-primary">Component Showcase</h1>
            <p className="text-lg text-secondary">Explore the design system with placeholder content</p>
          </div>

          {/* Breadcrumbs */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Breadcrumbs</h2>
            <Breadcrumb>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/components">Components</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Showcase</BreadcrumbPage>
              </BreadcrumbItem>
            </Breadcrumb>
          </section>

          {/* Buttons */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Buttons</h2>
            <div className="flex flex-wrap gap-3 bg-surface p-6 rounded-2xl border border-border-default">
              <Button variant="default">Primary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="destructive">Destructive Button</Button>
              <Button size="sm">Small</Button>
              <Button size="lg">Large</Button>
            </div>
          </section>

          {/* Badges */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Badges</h2>
            <div className="flex flex-wrap gap-3 bg-surface p-6 rounded-2xl border border-border-default">
              <Badge variant="default">A1 Beginner</Badge>
              <Badge variant="secondary">A2 Elementary</Badge>
              <Badge variant="outline">B1 Intermediate</Badge>
              <Badge variant="ghost">B2 Upper-Int</Badge>
              <Badge variant="destructive">Error State</Badge>
            </div>
          </section>

          {/* Cards */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Card Title</CardTitle>
                  <CardDescription>This is a card description</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.</p>
                </CardContent>
                <CardFooter>
                  <Button size="sm">Action</Button>
                </CardFooter>
              </Card>

              <Card size="sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Small Card</CardTitle>
                      <CardDescription>Compact version</CardDescription>
                    </div>
                    <CardAction>
                      <Button size="xs" variant="ghost">+</Button>
                    </CardAction>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">Smaller padding and spacing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Learning Module
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>Master the fundamentals of language learning</p>
                  <Progress value={65} className="h-2" />
                  <p className="text-xs text-muted">65% Complete</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>User Profile</CardTitle>
                    </div>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-secondary">john@example.com</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Form Components */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Form Components</h2>
            <Card>
              <CardHeader>
                <CardTitle>Input Fields</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Enter your full name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Enter your message here..." rows={4} />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Radio Group */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Radio Group</h2>
            <Card>
              <CardHeader>
                <CardTitle>Select Your Level</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={selectedRadio} onValueChange={setSelectedRadio}>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="option1" id="option1" />
                    <Label htmlFor="option1">Beginner (A1)</Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value="option2" id="option2" />
                    <Label htmlFor="option2">Elementary (A2)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="option3" id="option3" />
                    <Label htmlFor="option3">Intermediate (B1)</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </section>

          {/* Tabs */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Tabs</h2>
            <Card>
              <CardHeader>
                <CardTitle>Learning Modules</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="grammar" className="w-full">
                  <TabsList>
                    <TabsTrigger value="grammar">Grammar</TabsTrigger>
                    <TabsTrigger value="reading">Reading</TabsTrigger>
                    <TabsTrigger value="listening">Listening</TabsTrigger>
                    <TabsTrigger value="writing">Writing</TabsTrigger>
                  </TabsList>
                  <TabsContent value="grammar" className="mt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Grammar Fundamentals</h3>
                      <p className="text-sm text-secondary">Learn the basic rules and structures of language grammar.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="reading" className="mt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Reading Comprehension</h3>
                      <p className="text-sm text-secondary">Improve your reading skills with curated passages.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="listening" className="mt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Listening Practice</h3>
                      <p className="text-sm text-secondary">Develop listening skills through audio exercises.</p>
                    </div>
                  </TabsContent>
                  <TabsContent value="writing" className="mt-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Writing Practice</h3>
                      <p className="text-sm text-secondary">Perfect your writing through guided exercises.</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </section>

          {/* Progress & Separator */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Progress & Separator</h2>
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>Your progress across different modules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Grammar</span>
                    <span className="text-sm text-muted">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Reading</span>
                    <span className="text-sm text-muted">60%</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
                <Separator />
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Listening</span>
                    <span className="text-sm text-muted">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Avatars */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Avatars</h2>
            <div className="flex flex-wrap gap-4 bg-surface p-6 rounded-2xl border border-border-default">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback>SN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
            </div>
          </section>

          {/* Dialog & Tooltip */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Dialog & Tooltip</h2>
            <div className="flex gap-4 bg-surface p-6 rounded-2xl border border-border-default items-center">
              <Dialog>
                <DialogTrigger render={<Button />}>
                  Open Dialog
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Welcome to Learning</DialogTitle>
                    <DialogDescription>
                      This is a dialog component showcasing modal functionality. You can use it for confirmations, forms, or additional information.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p>Dialog content goes here. You can add any content inside.</p>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => {}}>Cancel</Button>
                      <Button>Confirm</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Tooltip>
                <TooltipTrigger render={<Button variant="outline" size="icon" />}>
                  <Zap className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Hover tooltip text</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </section>

          {/* Skeleton */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Skeleton</h2>
            <Card>
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-60" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
              </CardContent>
            </Card>
          </section>

          {/* Color Reference Cards */}
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-primary">Color System</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-base p-4 rounded-lg border border-border-default text-center">
                <div className="h-20 bg-base rounded mb-2"></div>
                <p className="text-xs text-muted">Background Base</p>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border-default text-center">
                <div className="h-20 bg-surface rounded mb-2 border border-border-default"></div>
                <p className="text-xs text-muted">Surface</p>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border-default text-center">
                <div className="h-20 bg-accent-primary rounded mb-2"></div>
                <p className="text-xs text-muted">Accent Primary</p>
              </div>
              <div className="bg-surface p-4 rounded-lg border border-border-default text-center">
                <div className="h-20 bg-accent-secondary rounded mb-2"></div>
                <p className="text-xs text-muted">Accent Secondary</p>
              </div>
            </div>
          </section>

          {/* Spacing */}
          <div className="h-16"></div>
        </div>
      </div>
    </TooltipProvider>
  );
}
