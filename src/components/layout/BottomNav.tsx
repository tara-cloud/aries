"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeOutlined, TeamOutlined, SearchOutlined, SettingOutlined } from "@ant-design/icons";
import { useTheme } from "@/components/layout/ThemeContext";

const NAV = [
  { key: "/",         label: "Home",    icon: <HomeOutlined />    },
  { key: "/members",  label: "Members", icon: <TeamOutlined />    },
  { key: "/search",   label: "Search",  icon: <SearchOutlined />  },
  { key: "/settings", label: "More",    icon: <SettingOutlined /> },
];

export default function BottomNav() {
  const pathname  = usePathname();
  const { dark }  = useTheme();
  const activeKey = NAV.find((n) => n.key !== "/" && pathname.startsWith(n.key))?.key ?? "/";

  return (
    <nav style={{
      position:   "fixed",
      bottom:     0,
      left:       0,
      right:      0,
      height:     60,
      background: dark ? "#1e293b" : "#ffffff",
      borderTop:  `1px solid ${dark ? "#334155" : "#f0f0f0"}`,
      display:    "flex",
      alignItems: "stretch",
      zIndex:     100,
    }}>
      {NAV.map(n => {
        const isActive = activeKey === n.key;
        return (
          <Link
            key={n.key}
            href={n.key}
            style={{
              flex:           1,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
              justifyContent: "center",
              gap:            2,
              color:          isActive ? "#6366f1" : dark ? "#94a3b8" : "#6b7280",
              textDecoration: "none",
              fontSize:       10,
              fontWeight:     isActive ? 600 : 400,
              transition:     "color 0.2s",
            }}
          >
            <span style={{ fontSize: 22 }}>{n.icon}</span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
