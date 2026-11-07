try {
  const stored = JSON.parse(localStorage.getItem('netherite.settings') ?? '{}')
  if (typeof stored?.theme === 'string') document.documentElement.dataset.theme = stored.theme
} catch {}
