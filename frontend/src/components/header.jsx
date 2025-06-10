"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link } from "react-router"
import { Input } from "@/components/ui/input"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
    Menu,
    Home,
    History
} from "lucide-react"

import logo from "@/assets/logo.png"

export default function StickyHeader() {
    const [isDarkMode, setIsDarkMode] = useState(false)
    const [notifications] = useState(3)

    const navigationItems = [
        { name: "Inicio", href: "/", icon: Home },
        { name: "Historial", href: "/historial", icon: History },
    ]

    const getInitials = (name) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <img src={logo} alt="Logo" className="size-12 block" />
                        </div>

                        {/* Navegación desktop */}
                        <nav className="hidden md:flex items-center gap-1">
                            {navigationItems.map((item) => (
                                <Button
                                    key={item.name}
                                    variant="ghost"
                                    size="sm"
                                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                                >
                                    <Link to={item.href} className="flex items-center gap-2">
                                        <item.icon className="h-4 w-4" />
                                        {item.name}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                    </div>




                    {/* Acciones del usuario */}
                    <div className="flex items-center gap-2">

                        {/* Menú móvil */}
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="sm" className="md:hidden">
                                    <Menu className="h-4 w-4" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-80">
                                <SheetHeader>
                                    <SheetTitle>Menú</SheetTitle>
                                    <SheetDescription>Navegación y configuración</SheetDescription>
                                </SheetHeader>
                                <div className="mt-6 space-y-4">


                                    <nav className="space-y-2">
                                        {navigationItems.map((item) => (
                                            <Button key={item.name} variant="ghost" className="w-full justify-start gap-2">
                                                <Link to={item.href} className="flex items-center gap-2">
                                                    <item.icon className="h-4 w-4" />
                                                    {item.name}
                                                </Link>
                                            </Button>
                                        ))}
                                    </nav>


                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    )
}
