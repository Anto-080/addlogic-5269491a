import { Users, Lock, LogOut, Tag, Heart, Sparkles } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import addlogicMark from "@/assets/addlogic-mark-square.jpg";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const LOVABLE_REF_URL = "https://lovable.dev/?utm_source=addlogic&utm_medium=sidebar&utm_campaign=self_referral";

const secondaryItems = [
  { title: "Connections", url: "/connections", icon: Users },
  { title: "Investments", url: "/investments", icon: Lock },
  { title: "Offers", url: "/offers", icon: Tag },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut, user } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full overflow-hidden ring-1 ring-primary/40 shrink-0">
            <img
              src={addlogicMark}
              alt="AddLogic"
              className="brand-asset h-full w-full object-cover"
            />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gradient-gold">AddLogic</h1>
              <p className="text-xs text-muted-foreground">Earn while you learn</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>More</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className="hover:bg-accent/50" activeClassName="bg-accent text-primary font-medium">
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && user && (
          <div className="text-xs text-muted-foreground truncate mb-2 px-2">
            {user.email}
          </div>
        )}
        <SidebarMenuButton onClick={signOut} className="text-muted-foreground hover:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && <span>Sign Out</span>}
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
