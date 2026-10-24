interface HeaderProps {
  activeTab: 'explorer' | 'accuracy';
  onTabChange: (tab: 'explorer' | 'accuracy') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-teal-700" />
            <span className="font-mono text-xs font-medium uppercase tracking-wider text-stone-500">
              Elexon BMRS · FUELHH &amp; WINDFOR · Jan 2026
            </span>
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-stone-900">
            UK Day-Ahead Wind Forecast &amp; Procurement Desk
          </h1>
          <p className="mt-0.5 text-sm text-stone-600">
            National wind generation forecasts and error quantification for day-ahead power purchase decisions.
          </p>
        </div>

        <nav className="flex self-start rounded-md border border-stone-200 bg-stone-100 p-1 sm:self-auto">
          <button
            type="button"
            onClick={() => onTabChange('explorer')}
            className={`rounded px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'explorer'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Forecast Explorer &amp; Reserve Sizing
          </button>
          <button
            type="button"
            onClick={() => onTabChange('accuracy')}
            className={`rounded px-3.5 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'accuracy'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Forecast Error Analysis
          </button>
        </nav>
      </div>
    </header>
  );
}
