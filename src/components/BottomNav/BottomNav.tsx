"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Library, Search } from "lucide-react";
import styles from "./BottomNav.module.css";

const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/library", icon: Library, label: "Library" },
];

export default function BottomNav() {
    const pathname = usePathname();
    const isSearchPage = pathname === "/search";

    return (
        <nav className={styles.nav}>
            {/* Main pill container */}
            <div className={styles.pill}>
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.item} ${isActive ? styles.active : ""}`}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            {/* Separate Search button */}
            <Link
                href="/search"
                className={`${styles.searchButton} ${isSearchPage ? styles.active : ""}`}
                aria-label="Search"
            >
                <Search size={22} strokeWidth={2.5} />
            </Link>
        </nav>
    );
}
