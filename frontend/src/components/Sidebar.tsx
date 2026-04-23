import { NavLink } from 'react-router-dom';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/etl', icon: '⚙️', label: 'ETL Pipeline' },
];

/**
 * Enterprise sidebar navigation with collapse toggle.
 * Uses NavLink for active-state highlighting.
 */
const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-slate-900 text-white flex flex-col z-40
        transition-all duration-300 ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
    >
      {/* Logo area */}
      <div className="p-4 flex items-center gap-3 border-b border-slate-700/50">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 
          flex items-center justify-center text-lg font-bold flex-shrink-0 shadow-lg">
          E
        </div>
        {!collapsed && (
          <span className="text-base font-semibold tracking-tight whitespace-nowrap">
            ETL Command
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 mt-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive
                ? 'bg-indigo-600/20 text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`
            }
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="p-3 border-t border-slate-700/50">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg 
            text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm"
        >
          <span className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}>
            ◀
          </span>
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
