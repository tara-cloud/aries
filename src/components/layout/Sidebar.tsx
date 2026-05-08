"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Layout, Menu, Avatar, Button, Typography, Radio, Divider } from "antd";
import {
  HomeOutlined, TeamOutlined, SearchOutlined, SettingOutlined,
  LogoutOutlined, SunOutlined, MoonOutlined, DesktopOutlined,
  FileSearchOutlined, SaveOutlined,
} from "@ant-design/icons";
import { useTheme } from "@/components/layout/ThemeContext";
import type { ThemePreference } from "@/components/layout/ThemeContext";
import AriesLogo from "@/components/AriesLogo";

const { Sider } = Layout;
const { Text } = Typography;

const NAV = [
  { key: "/",               label: "Dashboard", icon: <HomeOutlined />       },
  { key: "/members",        label: "Members",   icon: <TeamOutlined />       },
  { key: "/search",         label: "Search",    icon: <SearchOutlined />     },
  { key: "/settings",       label: "Settings",  icon: <SettingOutlined />    },
  { key: "/admin/backups",  label: "Backups",   icon: <SaveOutlined />       },
  { key: "/admin/logs",     label: "Logs",      icon: <FileSearchOutlined /> },
];

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "Light",  icon: <SunOutlined />     },
  { value: "dark",   label: "Dark",   icon: <MoonOutlined />    },
  { value: "system", label: "System", icon: <DesktopOutlined /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { dark, preference, setPreference } = useTheme();

  const activeKey = NAV.find((n) => n.key !== "/" && pathname.startsWith(n.key))?.key ?? "/";

  return (
    <Sider
      width={220}
      style={{
        height: "100vh",
        position: "sticky",
        top: 0,
        background: dark ? "#1e293b" : "#ffffff",
        borderRight: `1px solid ${dark ? "#334155" : "#f0f0f0"}`,
        transition: "background 0.3s",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{
        padding: "20px",
        borderBottom: `1px solid ${dark ? "#334155" : "#f0f0f0"}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          flexShrink: 0, overflow: "hidden",
        }}>
          <AriesLogo size={32} />
        </div>
        <Text strong style={{ fontSize: 18, color: "#6366f1" }}>Aries</Text>
      </div>

      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        theme={dark ? "dark" : "light"}
        style={{
          flex: 1,
          borderRight: "none",
          background: "transparent",
          marginTop: 8,
        }}
        items={NAV.map((n) => ({
          key: n.key,
          icon: n.icon,
          label: <Link href={n.key}>{n.label}</Link>,
        }))}
      />

      <div style={{
        padding: "12px 16px",
        borderTop: `1px solid ${dark ? "#334155" : "#f0f0f0"}`,
      }}>
        <Text strong style={{ display: "block", marginBottom: 8, fontSize: 11, opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          Appearance
        </Text>
        <Radio.Group
          value={preference}
          onChange={e => setPreference(e.target.value as ThemePreference)}
          style={{ display: "flex", gap: 4 }}
        >
          {THEME_OPTIONS.map(opt => (
            <Radio.Button key={opt.value} value={opt.value} title={opt.label} style={{ padding: "0 8px" }}>
              {opt.icon}
            </Radio.Button>
          ))}
        </Radio.Group>
      </div>

      <Divider style={{ margin: 0 }} />

      <div style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <Avatar size="small" style={{ background: "#6366f1", flexShrink: 0 }}>
          {session?.user?.name?.[0]?.toUpperCase() ?? session?.user?.email?.[0]?.toUpperCase()}
        </Avatar>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text style={{ display: "block", fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session?.user?.name ?? "User"}
          </Text>
          <Text type="secondary" style={{ display: "block", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {session?.user?.email}
          </Text>
        </div>
        <Button
          type="text"
          icon={<LogoutOutlined />}
          size="small"
          onClick={() => signOut({ redirect: false }).then(() => { globalThis.location.href = "/login"; })}
          title="Sign out"
          style={{ color: dark ? "#94a3b8" : "#6b7280" }}
        />
      </div>
    </Sider>
  );
}
