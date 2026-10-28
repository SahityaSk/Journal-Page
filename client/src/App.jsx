import { useCallback, useEffect, useMemo, useState } from 'react';
import initialIssues from '../../server/data/initialIssues.js';

async function api(path, { token, headers: extraHeaders = {}, ...fetchOptions } = {}) {
  const response = await fetch(`/api${path}`, {
    ...fetchOptions,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extraHeaders },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status})`);
  return payload;
}

function Brand() {
  return <a className="brand" href="/" aria-label="Institute of Natural Sciences and Applied Technology home"><img className="official-logo" src="/insat-logo.avif" alt="" /><span className="brand-copy"><strong>INSAT</strong><small>Institute of Natural Sciences<br />and Applied Technology</small></span></a>;
}

const siteMenus = [
  { label: 'About', href: '/about', items: [['The Organisation', '/about/organisation'], ['Mission & Vision', '/about/mission-vision'], ['Centers', '/about/centers']] },
  { label: 'Research', href: '/research', items: [['Thrust Areas', '/research/thrust-areas'], ['Facilities', '/research/facilities'], ['Publications', '/research/publications'], ['Publication Ethics and Publication Malpractice', '/research/publication-ethics'], ['Books / Proceedings', '/research/books-proceedings']] },
  { label: 'People', href: '/people', items: [['International Advisory Committee', '/people/advisory-committee'], ['Researchers', '/people/researchers'], ['Researcher Home Page', '/people/researcher-home-page'], ['Students', '/people/students'], ['Alumni', '/people/alumni']] },
  { label: 'Journals', href: '/journals', items: [['Natural Sciences and Applied Technology', '/journals/natural-sciences-applied-technology'], ['Natural Sciences & Applied Tech: Issues', '/issues'], ['Reviews and Reports', '/journals/reviews-reports'], ['Reviews and Reports Issues', '/journals/reviews-reports-issues']] },
  { label: 'Engage', href: '/engage', items: [['Careers', '/engage/careers'], ['Collaborators', '/engage/collaborators'], ['Partners', '/engage/partners'], ['Sponsors', '/engage/sponsors']] },
  { label: 'Announcements', href: '/announcements', items: [['News', '/announcements/news'], ['Events', '/announcements/events'], ['Advertisements', '/announcements/advertisements']] },
  { label: 'Media', href: '/media', items: [['Print', '/media/print'], ['Photos', '/media/photos'], ['Video', '/media/video']] },
];

function Header() {
  const [openMenu, setOpenMenu] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const isActive = (href) => href === '/' ? currentPath === '/' : currentPath === href || currentPath.startsWith(`${href}/`);
  return <><div className="topline"><nav className={`topline-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation"><a className={`topline-home ${isActive('/') ? 'nav-active' : ''}`} href="/">Home</a>{siteMenus.map(({ label, href, items }) => <div key={href} className={`topline-item ${isActive(href) ? 'nav-active' : ''} ${openMenu === href ? 'menu-expanded' : ''}`} onMouseEnter={() => setOpenMenu(href)} onMouseLeave={() => setOpenMenu('')}><a className="topline-link" href={href}>{label}</a><button type="button" className="dropdown-toggle" aria-label={`Show ${label} pages`} aria-expanded={openMenu === href} onClick={() => setOpenMenu(openMenu === href ? '' : href)}>⌄</button><div className="topline-dropdown">{items.map(([item, itemHref]) => <a key={itemHref} href={itemHref} onClick={() => { setOpenMenu(''); setMenuOpen(false); }}>{item}</a>)}</div></div>)}<a className={`topline-contact ${isActive('/contact') ? 'nav-active' : ''}`} href="/contact">Contact</a></nav><span className="topline-meta">Peer reviewed · Open access · ISSN 3049-4206</span><button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button></div><header className="site-header"><Brand /><div className="header-actions"><a className="editor-login" href="/account?mode=login">Log in</a><a className="account-register" href="/account?mode=register">Register</a><a className="submit-link" href="/account?mode=register">Submit a paper <span>↗</span></a></div></header></>;
}

function Hero() {
  return <><section className="hero"><div className="hero-content"><div className="eyebrow"><span className="eyebrow-line" /> JOURNAL OF NATURAL SCIENCES &amp; APPLIED TECHNOLOGY</div><h1>Research across<br /><em>science and technology</em></h1><p className="hero-intro">A peer-reviewed, open access journal published by the Institute of Natural Sciences and Applied Technology, Kolkata.</p><div className="hero-buttons"><a className="text-link" href="/issues">Browse journal issues <span>›</span></a><a className="hero-secondary-link" href="/for-authors">Information for authors</a></div><div className="hero-meta"><span>ISSN 3049-4206</span><span className="meta-divider" /><span>2024 — 2026</span><span className="meta-divider" /><span>Open access</span></div></div><div className="hero-art" aria-label="INSAT journal and current issue"><div className="hero-art-top"><span>INSAT · KOLKATA</span><span>VOL. 03 / 2026</span></div><div className="hero-art-orbit orbit-one" /><div className="hero-art-orbit orbit-two" /><div className="hero-art-core"><span>INSAT</span><small>NATURAL SCIENCES<br />&amp; APPLIED TECHNOLOGY</small></div><div className="hero-art-caption"><span>Current issue</span><strong>The September edition</strong><small>Volume 3 · Issue 2 · 2026</small><a href="/issues?year=2026">View issue contents ›</a></div></div><div className="hero-footnote">Published by the Institute of Natural Sciences and Applied Technology, India</div></section><div className="journal-notice"><strong>JOURNAL NOTICE</strong><span>Explore the latest multidisciplinary research in the INSAT issue archive.</span><a href="/issues">Browse issues ›</a></div></>;
}

function IssueCover({ issue }) {
  return <div className={`issue-cover ${issue.cover || 'cover-green'}`} aria-label="Issue cover artwork"><span className="cover-label">NATURAL SCIENCES<br />&amp; APPLIED TECH.</span><strong>{issue.volume?.replace('Vol. ', 'V')}</strong><small>{issue.year} · INSAT</small></div>;
}

function IssueDialog({ issue, onClose }) {
  useEffect(() => {
    if (!issue) return undefined;
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [issue, onClose]);
  if (!issue) return null;
  const groups = Object.entries((issue.articles || []).reduce((result, article) => {
    (result[article.category || 'Research'] ||= []).push(article);
    return result;
  }, {}));
  return <div className="dialog-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="issue-dialog issue-dialog-open" role="dialog" aria-modal="true" aria-labelledby="dialog-title"><button className="dialog-close" aria-label="Close issue details" onClick={onClose}>×</button><div className="dialog-head"><div className="eyebrow"><span className="eyebrow-line" />{issue.type === 'special' ? 'SPECIAL ISSUE' : 'JOURNAL ISSUE'}</div><h2 id="dialog-title">{issue.title}</h2>{issue.subtitle && <div className="dialog-subtitle">{issue.subtitle}</div>}<div className="dialog-meta"><span>{issue.volume} · {issue.year}</span><span>{issue.date}</span><span>Open access</span></div></div><div className="dialog-body">{groups.map(([category, articles]) => <div className="article-group" key={category}><div className="dialog-toolbar"><span>{category}</span><span>{String(articles.length).padStart(2, '0')} PAPERS</span></div><ol className="article-list">{articles.map((article, index) => <li className="article-row" key={article._id || `${article.title}-${index}`}><h3><a href={`/article/${issue.slug}/${issue.articles.indexOf(article)}`}>{article.title}</a></h3><p>{article.authors}</p>{article.pages && <span className="article-pages">Pages {article.pages}</span>}</li>)}</ol></div>)}{issue.type === 'special' && <div className="dialog-editor"><strong>Guest editor</strong><br />{issue.descriptor}</div>}<div className="dialog-editor">Published by the Institute of Natural Sciences and Applied Technology, Kolkata. Article and submission enquiries: <a href="mailto:office.insat@gmail.com">office.insat@gmail.com</a>.</div></div></section></div>;
}

const previewIssues = initialIssues.map(({ id, ...issue }) => ({ ...issue, slug: id, _id: id }));

function IssueArchive({ specialOnly = false, compact = false }) {
  const [issues, setIssues] = useState(previewIssues);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(() => new URLSearchParams(window.location.search).get('year') || 'all');
  const [type, setType] = useState(specialOnly ? 'special' : 'all');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingPreview, setUsingPreview] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [availableYears, setAvailableYears] = useState([...new Set(previewIssues.map((issue) => issue.year))].sort((a, b) => b - a));

  useEffect(() => {
    api('/issues').then(({ issues: allIssues }) => {
      setAvailableYears([...new Set(allIssues.map((issue) => issue.year))].sort((a, b) => b - a));
    }).catch(() => setAvailableYears([...new Set(previewIssues.map((issue) => issue.year))].sort((a, b) => b - a)));
  }, []);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search.trim()) params.set('q', search.trim());
    if (year !== 'all') params.set('year', year);
    if (type !== 'all') params.set('type', type);
    return params.toString();
  }, [search, year, type]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await api(`/issues${query ? `?${query}` : ''}`);
        if (active) { setIssues(result.issues); setUsingPreview(false); }
      } catch {
        if (active) {
          const normalizedQuery = search.trim().toLowerCase();
          const filteredIssues = previewIssues.filter((issue) => {
            const matchesYear = year === 'all' || String(issue.year) === year;
            const matchesType = type === 'all' || issue.type === type;
            const searchFields = [issue.volume, issue.year, issue.type, issue.date, issue.period, issue.title, issue.subtitle, issue.descriptor, ...(issue.articles || []).flatMap((article) => [article.category, article.title, article.authors])].join(' ').toLowerCase();
            return matchesYear && matchesType && (!normalizedQuery || searchFields.includes(normalizedQuery));
          });
          setIssues(filteredIssues); setUsingPreview(true);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, search ? 180 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, reloadKey, search, type, year]);

  const reset = () => { setSearch(''); setYear('all'); setType(specialOnly ? 'special' : 'all'); };
  const shownIssues = compact ? issues.slice(0, expanded ? issues.length : 4) : issues;

  return <><section className={`issue-section ${compact ? 'compact-archive' : ''}`} id="issues"><div className="section-heading"><div><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" />{compact ? 'LATEST FROM THE JOURNAL' : specialOnly ? 'THEMED EDITIONS' : 'BROWSE THE ARCHIVE'}</div><h2>{compact ? <>Fresh research, <em>in context.</em></> : specialOnly ? <>Special issues, <em>new perspectives.</em></> : <>Every issue, <em>one place.</em></>}</h2></div><p>{compact ? 'Read the latest multidisciplinary research from the INSAT archive.' : specialOnly ? 'Focused collections bring researchers together around a shared question.' : 'Follow a subject, explore an edition, or search the complete archive.'}</p></div>{!compact && <div className="archive-tools"><label className="search-box"><span className="search-icon" aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, authors, topics..." autoComplete="off" /><kbd>/</kbd></label><label className="select-wrap"><span className="sr-only">Filter by year</span><select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All years</option>{availableYears.map((item) => <option value={item} key={item}>{item}</option>)}</select><span className="select-chevron">⌄</span></label><div className="view-switch" role="group" aria-label="Issue type"><button className={`view-btn ${type === 'all' ? 'selected' : ''}`} onClick={() => setType('all')}>All issues</button><button className={`view-btn ${type === 'special' ? 'selected' : ''}`} onClick={() => setType(type === 'special' ? 'all' : 'special')}>Special issues <span className="special-count">{String(issues.filter((issue) => issue.type === 'special').length).padStart(2, '0')}</span></button></div></div>}<div className="results-line"><span aria-live="polite">{loading ? 'LOADING ISSUE ARCHIVE…' : compact ? 'RECENT EDITIONS' : `${String(issues.length).padStart(2, '0')} ${issues.length === 1 ? 'ISSUE' : 'ISSUES'} FOUND`}</span><span>{usingPreview ? 'PREVIEW CONTENT · LIVE ARCHIVE CONNECTS WHEN AVAILABLE' : 'Sorted by publication date'} <span className="sort-arrow">↓</span></span></div><div className="issue-list">{shownIssues.map((issue, index) => <article className={`issue-card ${issue.type === 'special' ? 'is-special' : ''}`} key={issue._id || issue.slug}><IssueCover issue={issue} /><div className="issue-main"><div className="issue-kicker"><span className="issue-volume">{issue.volume} ({issue.year})</span><span className="issue-type">{issue.type === 'special' ? 'Special issue' : 'Regular issue'}</span></div><h3 className="issue-title">{issue.title}</h3>{issue.subtitle && <div className="issue-theme">{issue.subtitle}</div>}<div className="issue-date">{issue.period} · Released {issue.date}</div></div><div className="issue-detail"><strong>{issue.type === 'special' ? 'Guest editor' : 'In this issue'}</strong><div className="issue-authors">{issue.descriptor}</div><div className="issue-stats"><span>{issue.articles?.length || 0} featured papers</span><span>·</span><span>Open access</span></div></div><div className="issue-action"><button type="button" onClick={() => setSelected(issue)} aria-label={`Browse ${issue.volume} contents`}>Browse contents <span>↗</span></button><small>{String(issues.length - index).padStart(2, '0')} / {String(issues.length).padStart(2, '0')}</small></div></article>)}</div>{!loading && !shownIssues.length && <div className="empty-state"><span>↗</span><h3>No issues found</h3><p>Try a different search term or year.</p><button onClick={reset}>Clear filters</button></div>}{compact && <div className="archive-more-actions">{issues.length > 4 && <button className="archive-more-button" onClick={() => setExpanded(!expanded)}>{expanded ? 'Show fewer issues ↑' : `See more issues (${issues.length - 4}) ↓`}</button>}<a className="text-link archive-more" href="/issues">View full archive <span>↗</span></a></div>}</section><IssueDialog issue={selected} onClose={() => setSelected(null)} /></>;
}

function InteriorHero({ eyebrow, title, emphasis, description }) {
  return <section className="interior-hero"><div className="interior-hero-inner"><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}<br /><em>{emphasis}</em></h1><p>{description}</p></div><div className="interior-coordinate" aria-hidden="true">INSAT<br />KOLKATA · INDIA</div></section>;
}

function HomePage() {
  return <><Hero /><div className="home-content-grid"><div className="home-primary"><section className="home-intro"><div className="home-intro-number">01 <span>—</span> JOURNAL</div><p><strong>Natural Sciences and Applied Technology</strong> is an international, multidisciplinary, peer-reviewed open access journal published by the Institute of Natural Sciences and Applied Technology, India.</p><a href="/about" className="text-link">Get to know the journal <span>↗</span></a></section><IssueArchive compact /></div><aside className="journal-sidebar"><div className="sidebar-call"><span className="sidebar-eyebrow">CALL FOR PAPERS</span><h2>Your next idea<br /><em>belongs here.</em></h2><p>We welcome thoughtful research across natural sciences and applied technology.</p><a href="/for-authors">Author information <span>↗</span></a></div><div className="sidebar-links"><span className="sidebar-eyebrow">QUICK LINKS</span><a href="/issues">Browse all issues <span>↗</span></a><a href="/special-issues">Explore special issues <span>↗</span></a><a href="mailto:office.insat@gmail.com">Contact the editors <span>↗</span></a></div><div className="sidebar-note"><span className="sidebar-note-mark">✳</span><p>Open research, shared freely.<br /><strong>Peer reviewed · Open access</strong></p></div></aside></div><section className="home-pillars"><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> A JOURNAL FOR INTERDISCIPLINARY IDEAS</div><div className="pillar-grid"><a className="pillar-card" href="/about"><span>01 / ABOUT</span><h3>Research that<br /><em>crosses boundaries.</em></h3><p>Discover the journal’s scope, publishing approach, and open access mission.</p><b>About the journal ↗</b></a><a className="pillar-card" href="/for-authors"><span>02 / CONTRIBUTE</span><h3>Bring your work<br /><em>into focus.</em></h3><p>Find author information and share an idea for a focused special issue.</p><b>For authors ↗</b></a><a className="pillar-card" href="/special-issues"><span>03 / EXPLORE</span><h3>One theme.<br /><em>Many perspectives.</em></h3><p>Browse focused collections that connect research across disciplines.</p><b>Special issues ↗</b></a></div></section></>;
}

function AboutPage() {
  return <><InteriorHero eyebrow="ABOUT THE JOURNAL" title="Curiosity across" emphasis="disciplines." description="An open access platform for research and ideas spanning natural sciences and applied technology." /><section className="editorial-page"><div className="editorial-lead"><span className="editorial-index">01 / OUR PURPOSE</span><div><h2>Connect discovery<br />with <em>application.</em></h2><p>Natural Sciences and Applied Technology serves as a platform for original research, reviews, short communications, and case studies. The journal encourages work that brings disciplines together, advances understanding, and responds to real-world challenges.</p><p>Published by the Institute of Natural Sciences and Applied Technology in Kolkata, INSAT shares research freely with readers around the world.</p></div></div><div className="journal-facts"><div><span>01</span><strong>Multidisciplinary</strong><small>Science, technology, and applied research</small></div><div><span>02</span><strong>Peer reviewed</strong><small>Editorial review for published research</small></div><div><span>03</span><strong>Open access</strong><small>Free access to published work</small></div><div><span>04</span><strong>Published by INSAT</strong><small>Kolkata, West Bengal, India</small></div></div><div className="scope-panel"><div><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> RESEARCH SCOPE</div><h2>Many fields.<br /><em>Shared questions.</em></h2></div><div><p>INSAT welcomes work across natural and physical sciences, mathematics, chemical and biological sciences, medicine, engineering, environmental science, computer science, data science, renewable energy, and sustainable development.</p><a href="/issues" className="text-link">Explore published issues <span>↗</span></a></div></div></section></>;
}

function AuthorsPage() {
  return <><InteriorHero eyebrow="INFORMATION FOR CONTRIBUTORS" title="Make room for" emphasis="new ideas." description="Share original research and interdisciplinary work with the Natural Sciences and Applied Technology community." /><section className="editorial-page author-page"><div className="submission-banner"><div><span>SUBMISSIONS</span><h2>Ready to contribute?</h2><p>Contact the editorial office for manuscript submission information, author templates, and publication guidance.</p></div><a className="button-light" href="mailto:office.insat@gmail.com?subject=INSAT%20Manuscript%20Enquiry">Contact the editorial office <span>↗</span></a></div><div className="author-grid"><article className="author-card"><span>01 / WHAT WE PUBLISH</span><h3>Research in many forms.</h3><p>Original research articles, comprehensive reviews, short communications, and case studies are welcome across the journal’s multidisciplinary scope.</p></article><article className="author-card"><span>02 / EDITORIAL REVIEW</span><h3>Careful consideration.</h3><p>Submissions are reviewed by the editorial team and undergo peer review. Manuscripts should be original, clearly written, and relevant to the journal’s scope.</p></article><article className="author-card"><span>03 / SPECIAL ISSUES</span><h3>Build a focused collection.</h3><p>Proposals should include a theme, scope, guest editor information, potential contributors, and a proposed timeline.</p><a href="mailto:office.insat@gmail.com?subject=INSAT%20Special%20Issue%20Proposal">Propose a special issue ↗</a></article></div><div className="author-note"><strong>Author support</strong><span>For current templates, manuscript requirements, or submission help, email <a href="mailto:office.insat@gmail.com">office.insat@gmail.com</a>.</span></div></section></>;
}

function SpecialIssuesPage() {
  return <><InteriorHero eyebrow="FOCUSED COLLECTIONS" title="Research, brought" emphasis="into focus." description="Special issues bring complementary work together around an emerging theme or a shared scientific challenge." /><IssueArchive specialOnly /><section className="proposal-strip"><div><span>GUEST EDITORS &amp; RESEARCHERS</span><h2>Have a theme in mind?</h2><p>Share a special issue proposal with the INSAT editorial office.</p></div><a className="button-light" href="mailto:office.insat@gmail.com?subject=INSAT%20Special%20Issue%20Proposal">Propose a collection <span>↗</span></a></section></>;
}

function ArticlePage() {
  const [, , issueSlug, articleIndex] = window.location.pathname.split('/');
  const [issue, setIssue] = useState(() => previewIssues.find((item) => item.slug === issueSlug) || null);
  const [copied, setCopied] = useState(false);
  const article = issue?.articles?.[Number(articleIndex)];
  useEffect(() => {
    api(`/issues/${encodeURIComponent(issueSlug)}`).then(({ issue: liveIssue }) => setIssue(liveIssue)).catch(() => {});
  }, [issueSlug]);
  useEffect(() => {
    if (article) document.title = `${article.title} | INSAT`;
  }, [article]);
  if (!issue || !article) return <><InteriorHero eyebrow="JOURNAL ARTICLE" title="Article not" emphasis="found." description="This article may have moved or is not available in the current archive." /><section className="article-page"><a className="text-link" href="/issues">Return to the journal archive ↗</a></section></>;
  const citation = `${article.authors} (${issue.year}). ${article.title}. ${issue.volume}, ${article.pages ? `pp. ${article.pages}` : ''}. Natural Sciences and Applied Technology.`;
  const copyCitation = async () => {
    try { await navigator.clipboard.writeText(citation); setCopied(true); window.setTimeout(() => setCopied(false), 2200); }
    catch { setCopied(false); }
  };
  return <><main className="article-page"><div className="article-breadcrumb"><a href="/">Home</a><span>/</span><a href="/issues">Issues</a><span>/</span><a href={`/issues?year=${issue.year}`}>{issue.volume}</a></div><div className="article-layout"><article className="article-reading"><div className="article-kind"><span>{article.category}</span><span>RESEARCH ARTICLE</span><span>OPEN ACCESS</span></div><h1>{article.title}</h1><p className="article-authors">{article.authors}</p><div className="article-publine"><span>{issue.volume} ({issue.year})</span><span>{issue.date}</span>{article.pages && <span>Pages {article.pages}</span>}</div><div className="article-actions"><button className="article-primary" onClick={copyCitation}>{copied ? 'Citation copied ✓' : 'Cite this article'}</button><a className="article-secondary" href="#abstract">Article record ↓</a></div><section className="article-abstract" id="abstract"><div className="article-section-label">ABOUT THIS RECORD</div><p>The INSAT archive currently lists this article’s title, authors, subject, and issue details. For the full text or further publication information, contact the editorial office.</p></section><section className="article-fulltext"><div className="article-section-label">ARTICLE INFORMATION</div><dl><div><dt>Published in</dt><dd>{issue.title}, {issue.volume} ({issue.year})</dd></div><div><dt>Subject</dt><dd>{article.category}</dd></div>{article.pages && <div><dt>Pages</dt><dd>{article.pages}</dd></div>}<div><dt>Access</dt><dd>Open access</dd></div></dl><div className="citation-box"><div className="article-section-label">HOW TO CITE</div><p>{citation}</p><button onClick={copyCitation}>{copied ? 'Copied' : 'Copy citation'}</button></div></section></article><aside className="article-sidebar"><div className="sidebar-card"><span className="sidebar-eyebrow">IN THIS ISSUE</span><h2>{issue.title}</h2><p>{issue.volume} · {issue.year}</p><a href={`/issues?year=${issue.year}`}>Browse issue contents ↗</a></div><div className="sidebar-card sidebar-submit"><span className="sidebar-eyebrow">PUBLISH WITH INSAT</span><h2>Share your research.</h2><p>Read author information and contact the editorial office about submitting your work.</p><a href="/for-authors">For authors ↗</a></div><div className="sidebar-contact">Questions about this article?<br /><a href="mailto:office.insat@gmail.com">Contact the editorial office</a></div></aside></div></main></>;
}

function ContactPage() {
  return <><InteriorHero eyebrow="CONTACT INSAT" title="Start a" emphasis="conversation." description="Questions about the journal, a manuscript, or a special issue? The editorial office is here to help." /><section className="contact-page"><div className="contact-primary"><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> EDITORIAL OFFICE</div><h2>Natural Sciences<br />and Applied Technology</h2><p>Institute of Natural Sciences and Applied Technology<br />Flat F, 1/55, Bijaygarh, Jadavpur<br />Kolkata 700032, West Bengal, India</p><a href="mailto:office.insat@gmail.com" className="contact-emphasis">office.insat@gmail.com <span>↗</span></a></div><div className="contact-side"><div><span>CALL THE EDITORIAL OFFICE</span><a href="tel:+917699787147">+91 7699787147</a><a href="tel:+919748547109">+91 9748547109</a></div><div><span>PUBLISHER</span><p>Director<br />Institute of Natural Sciences and Applied Technology</p></div><a className="map-link" href="https://maps.google.com/?q=Flat+F+1%2F55+Bijaygarh+Jadavpur+Kolkata+700032" target="_blank" rel="noreferrer">View the Kolkata address on a map ↗</a></div></section></>;
}

const institutePages = {
  '/research': {
    title: 'Research', eyebrow: 'DISCOVERY & APPLICATION', heading: 'Ideas that move knowledge forward.',
    intro: 'INSAT brings natural sciences and applied technology together through inquiry, collaboration, and practical work.',
    cards: [['Natural sciences', 'Explore questions across the physical, chemical, biological, and environmental sciences.'], ['Applied technology', 'Connect scientific understanding with engineering, computing, data, and useful technologies.'], ['Interdisciplinary work', 'Share approaches that cross fields and respond to complex real-world challenges.']],
  },
  '/people': {
    title: 'People', eyebrow: 'OUR COMMUNITY', heading: 'Researchers, editors, and collaborators.',
    intro: 'The INSAT community includes people who support research, peer review, publishing, and the exchange of ideas.',
    cards: [['Editorial office', 'The editorial team coordinates journal enquiries, submissions, and publication matters.'], ['Authors & reviewers', 'Researchers contribute original work and help maintain a thoughtful peer review process.'], ['Collaborators', 'Institutions and partners help create opportunities for shared learning and research.']],
  },
  '/engage': {
    title: 'Engage', eyebrow: 'TAKE PART', heading: 'Be part of the conversation.',
    intro: 'Connect with INSAT through research, journal contributions, focused collections, and community enquiries.',
    cards: [['Contribute research', 'Find guidance for authors and contact the editorial office about a manuscript.', 'For authors', '/for-authors'], ['Propose a special issue', 'Bring researchers together around a timely topic or shared scientific question.', 'Explore special issues', '/special-issues'], ['Get in touch', 'Send the institute a question about the journal, research, or collaboration.', 'Contact INSAT', '/contact']],
  },
  '/announcements': {
    title: 'Announcements', eyebrow: 'NEWS FROM INSAT', heading: 'Updates from the journal.',
    intro: 'Find publication updates, calls for papers, and notices from the INSAT editorial office.',
    cards: [['Call for papers', 'INSAT welcomes original research, reviews, short communications, and case studies across its multidisciplinary scope.', 'Author information', '/for-authors'], ['Special issue proposals', 'Researchers and guest editors can share proposals for focused, interdisciplinary collections.', 'Proposal information', '/special-issues'], ['Journal archive', 'Browse published issues and article records from the INSAT journal.', 'Browse journals', '/journals']],
  },
  '/media': {
    title: 'Media', eyebrow: 'MEDIA & RESOURCES', heading: 'INSAT resources and updates.',
    intro: 'Access journal resources and contact the institute for media, publication, and communication enquiries.',
    cards: [['Journal issues', 'Explore published editions and the research recorded in the archive.', 'Open the archive', '/journals'], ['Institute information', 'Learn about INSAT and its work in natural sciences and applied technology.', 'About INSAT', '/about'], ['Media enquiries', 'Contact the editorial office for questions about journal content and institute information.', 'Contact the office', '/contact']],
  },
};

const menuPages = {
  '/about/organisation': ['The Organisation', 'INSAT is an institute focused on natural sciences and applied technology, bringing research, education, and practical innovation together.'],
  '/about/mission-vision': ['Mission & Vision', 'INSAT works to advance scientific knowledge and innovation through interdisciplinary research, education, and solutions to shared challenges.'],
  '/about/centers': ['Centers', 'INSAT centers connect expertise, facilities, and collaborators around research and applied technology priorities.'],
  '/research/thrust-areas': ['Thrust Areas', 'INSAT research explores sustainability, energy conversion, waste management, environmental science, and advanced technologies.'],
  '/research/facilities': ['Facilities', 'Research facilities support practical experimentation, interdisciplinary projects, training, and collaboration.'],
  '/research/publications': ['Publications', 'Explore research outputs from INSAT, including journal articles, reviews, reports, books, and proceedings.'],
  '/research/publication-ethics': ['Publication Ethics and Publication Malpractice', 'INSAT expects integrity, transparency, responsible authorship, fair review, and corrections when the scholarly record needs attention.'],
  '/research/books-proceedings': ['Books / Proceedings', 'INSAT shares scholarly books and proceedings that document research, conferences, and applied work.'],
  '/people/advisory-committee': ['International Advisory Committee', 'The international advisory community offers guidance and perspective across the institute’s research and publication activities.'],
  '/people/researchers': ['Researchers', 'INSAT researchers work across natural sciences, applied technology, sustainability, and interdisciplinary innovation.'],
  '/people/researcher-home-page': ['Researcher Home Page', 'Find researcher profiles, areas of interest, and ways to connect with the INSAT research community.'],
  '/people/students': ['Students', 'INSAT encourages students to build scientific knowledge through hands-on learning, research, and collaboration.'],
  '/people/alumni': ['Alumni', 'INSAT alumni carry their experience into research, education, industry, and community work.'],
  '/journals/natural-sciences-applied-technology': ['Natural Sciences and Applied Technology', 'A peer-reviewed, open access journal published by the Institute of Natural Sciences and Applied Technology.'],
  '/journals/reviews-reports': ['Reviews and Reports', 'Read review articles and reports that bring evidence, emerging topics, and applied research into focus.'],
  '/journals/reviews-reports-issues': ['Reviews and Reports Issues', 'Browse collected editions of Reviews and Reports and explore their published contributions.'],
  '/engage/careers': ['Careers', 'Explore opportunities to contribute to research, education, and the institute’s technology movement.'],
  '/engage/collaborators': ['Collaborators', 'INSAT welcomes collaboration with researchers, institutions, industry, and communities on shared challenges.'],
  '/engage/partners': ['Partners', 'Partnerships connect INSAT with schools, universities, organizations, and industry for research and outreach.'],
  '/engage/sponsors': ['Sponsors', 'Sponsors can support research, education, and outreach initiatives that contribute to sustainable development.'],
  '/announcements/news': ['News', 'Read news and updates from INSAT, its research community, and journal activities.'],
  '/announcements/events': ['Events', 'Find talks, workshops, conferences, and outreach activities connected with science and technology.'],
  '/announcements/advertisements': ['Advertisements', 'View notices and opportunities shared by the institute and its academic community.'],
  '/media/print': ['Print', 'Browse print resources and publications from the Institute of Natural Sciences and Applied Technology.'],
  '/media/photos': ['Photos', 'Explore photos from INSAT research, events, education, and outreach.'],
  '/media/video': ['Video', 'Watch videos featuring INSAT initiatives, science communication, and community activities.'],
};

function InstitutePage({ page }) {
  return <><InteriorHero eyebrow={page.eyebrow} title={page.title} emphasis="at INSAT." description={page.intro} /><section className="editorial-page institute-page"><div className="editorial-lead"><span className="editorial-index">INSAT / {page.title.toUpperCase()}</span><div><h2>{page.heading}</h2><p>{page.intro}</p></div></div><div className="author-grid">{page.cards.map(([title, description, link, href]) => <article className="author-card" key={title}><span>{page.title.toUpperCase()}</span><h3>{title}</h3><p>{description}</p>{href && <a href={href}>{link} ↗</a>}</article>)}</div></section></>;
}

function Footer() {
  return <><section className="callout"><div className="callout-index">05 <span>—</span> 26</div><div><div className="eyebrow light-eyebrow"><span className="eyebrow-line" /> CALL FOR PAPERS</div><h2>Have a question worth<br /><em>bringing into focus?</em></h2><p>INSAT welcomes original research, reviews, short communications, and special issue proposals across disciplines.</p><a className="button-light" href="mailto:office.insat@gmail.com?subject=INSAT%20Special%20Issue%20Proposal">Propose a special issue <span>↗</span></a></div><div className="callout-mark" aria-hidden="true"><span>+</span><span>×</span><span>+</span><span>×</span></div></section><section className="contact-strip"><div><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> PUBLISHED BY INSAT</div><h2>Research belongs<br />in the conversation.</h2></div><div className="contact-info"><p>Institute of Natural Sciences and Applied Technology<br />Flat F, 1/55, Bijaygarh, Jadavpur, Kolkata 700032,<br />West Bengal, India</p><a href="mailto:office.insat@gmail.com">office.insat@gmail.com <span>↗</span></a></div><div className="contact-info contact-phone"><span>EDITORIAL OFFICE</span><a href="tel:+917699787147">+91 7699787147</a><a href="tel:+919748547109">+91 9748547109</a></div></section><footer className="site-footer"><a className="footer-brand" href="#top">INS<span>AT</span></a><span>© 2026 Institute of Natural Sciences and Applied Technology</span><a href="https://www.insat-res.in/">insat-res.in ↗</a><a href="/admin">Editorial admin ↗</a></footer></>;
}

const emptySubmission = { title: '', category: '', abstract: '', keywords: '' };

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

function AccountPage() {
  const [mode, setMode] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'register' ? 'register' : 'login');
  const [token, setToken] = useState(() => sessionStorage.getItem('insat-user-token') || '');
  const [user, setUser] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState(emptySubmission);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const loadSubmissions = useCallback(async (sessionToken) => {
    const result = await api('/submissions/mine', { token: sessionToken });
    setSubmissions(result.submissions);
  }, []);

  useEffect(() => {
    if (!token) return;
    api('/auth/me', { token }).then(({ user: account }) => { setUser(account); return loadSubmissions(token); }).catch(() => {
      sessionStorage.removeItem('insat-user-token'); setToken(''); setUser(null);
      setError('Account services are unavailable. Please try again when the journal API is online.');
    });
  }, [token, loadSubmissions]);

  const authenticate = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const result = await api(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ name, email, password }) });
      sessionStorage.setItem('insat-user-token', result.token); setToken(result.token); setUser(result.user); setPassword('');
      await loadSubmissions(result.token);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const startEdit = (submission) => {
    setEditingId(submission.id);
    setForm({ title: submission.title, category: submission.category, abstract: submission.abstract, keywords: submission.keywords || '' });
    setFile(null); setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetSubmissionForm = () => { setEditingId(''); setForm(emptySubmission); setFile(null); setError(''); setNotice(''); };

  const saveSubmission = async (event) => {
    event.preventDefault(); setBusy(true); setError(''); setNotice('');
    try {
      const payload = { ...form };
      if (file) payload.file = { name: file.name, contentType: file.type, data: toBase64(await file.arrayBuffer()) };
      const result = await api(editingId ? `/submissions/${editingId}` : '/submissions', {
        method: editingId ? 'PUT' : 'POST', token, body: JSON.stringify(payload),
      });
      setNotice(result.message); resetSubmissionForm(); await loadSubmissions(token);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const downloadFile = async (submission) => {
    setError('');
    try {
      const response = await fetch(`/api/submissions/${submission.id}/file`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not download this manuscript.');
      const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a');
      link.href = url; link.download = submission.attachment.name; link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.message); }
  };

  const logout = async () => {
    try { await api('/auth/logout', { method: 'POST', token }); } catch { /* Clear the local session even if the API is offline. */ }
    sessionStorage.removeItem('insat-user-token'); setToken(''); setUser(null); setSubmissions([]); resetSubmissionForm(); setNotice('You are logged out.');
  };

  return <><InteriorHero eyebrow="INSAT AUTHOR ACCOUNT" title={user ? `Welcome, ${user.name.split(' ')[0]}` : mode === 'register' ? 'Create your' : 'Log in to your'} emphasis={user ? 'author desk.' : 'author account.'} description="Published journal issues remain open to everyone. Author accounts let you submit manuscripts and manage your own submissions." /><section className="account-page">{!user ? <form className="account-card" onSubmit={authenticate}><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" />{mode === 'register' ? 'NEW AUTHOR' : 'AUTHOR ACCESS'}</div><h2>{mode === 'register' ? 'Create an account' : 'Welcome back.'}</h2><p className="account-help">{mode === 'register' ? 'Register to send a manuscript to the INSAT editorial office and track your submission.' : 'Log in to manage manuscripts you have submitted to INSAT.'}</p>{mode === 'register' && <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} /></label>}<label>Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={mode === 'register' ? 12 : undefined} maxLength={128} required />{mode === 'register' && <small>Use at least 12 characters.</small>}</label>{error && <div className="account-error" role="alert">{error}</div>}<button className="admin-primary" disabled={busy}>{busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Log in'}</button><p className="account-switch">{mode === 'register' ? 'Already registered?' : 'New to INSAT?'} <button type="button" onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); }}>{mode === 'register' ? 'Log in' : 'Create an account'}</button></p><p className="account-security">Your manuscript is private to you and the editorial team. Uploaded files may be PDF, DOC, or DOCX up to 5 MB.</p></form> : <div className="account-dashboard"><div className="account-dashboard-head"><div><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" />AUTHOR DESK</div><h2>Your submissions</h2><p>Update your manuscript details or replace its file while it is open for review.</p></div><button className="admin-secondary" onClick={logout}>Log out</button></div><div className="account-layout"><form className="account-card submission-form" onSubmit={saveSubmission}><h3>{editingId ? 'Edit your submission' : 'Submit a manuscript'}</h3><label>Manuscript title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required maxLength={300} /></label><label>Research area<input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="For example, environmental science" required maxLength={120} /></label><label>Abstract<textarea rows="7" value={form.abstract} onChange={(event) => setForm({ ...form, abstract: event.target.value })} required maxLength={12000} /></label><label>Keywords<input value={form.keywords} onChange={(event) => setForm({ ...form, keywords: event.target.value })} placeholder="Separate keywords with commas" maxLength={1000} /></label><label>Manuscript file {editingId && <span>(leave empty to keep the current file)</span>}<input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] || null)} required={!editingId} /></label>{error && <div className="account-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}<div className="admin-actions"><button className="admin-primary" disabled={busy}>{busy ? 'Saving…' : editingId ? 'Save changes' : 'Submit for review'}</button>{editingId && <button className="admin-secondary" type="button" onClick={resetSubmissionForm}>Cancel</button>}</div><p className="account-security">Submitting sends your manuscript to INSAT’s editorial office for review. It is not published automatically. You can edit open submissions at any time.</p></form><section className="submission-list"><h3>Manuscript history</h3>{submissions.length ? submissions.map((submission) => <article className="submission-item" key={submission.id}><div className="submission-item-head"><span className={`submission-status status-${submission.status}`}>{submission.status.replaceAll('_', ' ')}</span><small>Updated {new Date(submission.updatedAt).toLocaleDateString()}</small></div><h4>{submission.title}</h4><p>{submission.category} · {submission.attachment.name}</p><div className="submission-actions"><button type="button" onClick={() => downloadFile(submission)}>Download file ↓</button>{!['accepted', 'rejected'].includes(submission.status) && <button type="button" onClick={() => startEdit(submission)}>Edit submission ↗</button>}</div></article>) : <div className="empty-state"><h3>No submissions yet</h3><p>Your manuscripts will appear here after you submit them.</p></div>}</section></div></div>}</section></>;
}

function AdminSubmissionQueue() {
  const [token] = useState(() => sessionStorage.getItem('insat-admin-token') || '');
  const [submissions, setSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    const result = await api('/admin/submissions', { token });
    setSubmissions(result.submissions);
  }, [token]);
  useEffect(() => { if (token) load().catch((requestError) => setError(requestError.message)); }, [token, load]);
  const setStatus = async (submission, status) => {
    setBusyId(submission.id); setError('');
    try {
      await api(`/admin/submissions/${submission.id}/status`, { method: 'PUT', body: JSON.stringify({ status }), token });
      setSubmissions((current) => current.map((item) => item.id === submission.id ? { ...item, status } : item));
    } catch (requestError) { setError(requestError.message); }
    finally { setBusyId(''); }
  };
  const download = async (submission) => {
    try {
      const response = await fetch(`/api/admin/submissions/${submission.id}/file`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Could not download this manuscript.');
      const url = URL.createObjectURL(await response.blob()); const link = document.createElement('a'); link.href = url; link.download = submission.attachment.name; link.click(); URL.revokeObjectURL(url);
    } catch (requestError) { setError(requestError.message); }
  };
  if (!token) return <><Header /><main className="admin-page"><section className="admin-login"><h2>Editorial access required</h2><p>Sign in to the editorial issue manager first, then open the submission inbox.</p><a className="admin-primary" href="/admin">Go to editorial login</a></section></main><Footer /></>;
  return <><Header /><main className="admin-page"><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> INSAT EDITORIAL OFFICE</div><div className="admin-heading"><div><h1>Submission <em>inbox.</em></h1><p>Private manuscripts sent by registered authors.</p></div><a className="admin-secondary" href="/admin">Issue management</a></div>{error && <div className="admin-error" role="alert">{error}</div>}<section className="submission-list editorial-submission-list">{submissions.length ? submissions.map((submission) => <article className="submission-item" key={submission.id}><div className="submission-item-head"><span className={`submission-status status-${submission.status}`}>{submission.status.replaceAll('_', ' ')}</span><small>Submitted {new Date(submission.submittedAt).toLocaleDateString()}</small></div><h4>{submission.title}</h4><p>{submission.category} · {submission.author?.name} · {submission.author?.email}</p><details><summary>Read abstract</summary><p>{submission.abstract}</p>{submission.keywords && <p>Keywords: {submission.keywords}</p>}</details><div className="submission-actions"><button type="button" onClick={() => download(submission)}>Download manuscript ↓</button><label>Review status<select disabled={busyId === submission.id} value={submission.status} onChange={(event) => setStatus(submission, event.target.value)}><option value="submitted">Submitted</option><option value="in_review">In review</option><option value="revision_requested">Revision requested</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option></select></label></div></article>) : !error && <div className="empty-state"><h3>No manuscripts yet</h3><p>Author submissions will appear here.</p></div>}</section></main><Footer /></>;
}

const emptyIssue = { volume: '', year: new Date().getFullYear(), type: 'regular', date: '', publishedAt: '', period: '', cover: 'cover-green', title: '', subtitle: '', descriptor: '', articles: [] };

function AdminPanel() {
  const [token, setToken] = useState(() => sessionStorage.getItem('insat-admin-token') || '');
  const [authenticated, setAuthenticated] = useState(false);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState(emptyIssue);
  const [articleText, setArticleText] = useState('[]');
  const [editingSlug, setEditingSlug] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const loadIssues = useCallback(async (authToken) => {
    const result = await api('/admin/issues', { token: authToken });
    setIssues(result.issues);
    setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    loadIssues(token).catch((requestError) => { setAuthenticated(false); setError(requestError.message); sessionStorage.removeItem('insat-admin-token'); });
  }, [token, loadIssues]);

  const login = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await loadIssues(token); sessionStorage.setItem('insat-admin-token', token); }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const editIssue = (issue) => {
    setEditingSlug(issue.slug);
    setForm({ ...issue, publishedAt: issue.publishedAt ? new Date(issue.publishedAt).toISOString().slice(0, 10) : '' });
    setArticleText(JSON.stringify(issue.articles || [], null, 2));
    setError(''); setNotice(''); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => { setEditingSlug(''); setForm({ ...emptyIssue }); setArticleText('[]'); setError(''); setNotice(''); };

  const saveIssue = async (event) => {
    event.preventDefault(); setError(''); setNotice(''); setBusy(true);
    try {
      const articles = JSON.parse(articleText);
      if (!Array.isArray(articles)) throw new Error('Articles must be a JSON array.');
      const payload = { ...form, year: Number(form.year), publishedAt: form.publishedAt || undefined, articles };
      const route = editingSlug ? `/admin/issues/${encodeURIComponent(editingSlug)}` : '/admin/issues';
      const result = await api(route, { method: editingSlug ? 'PUT' : 'POST', body: JSON.stringify(payload), token });
      setNotice(editingSlug ? 'Issue updated.' : 'Issue created.');
      setForm({ ...result.issue, publishedAt: result.issue.publishedAt ? new Date(result.issue.publishedAt).toISOString().slice(0, 10) : '' });
      setEditingSlug(result.issue.slug); setArticleText(JSON.stringify(result.issue.articles || [], null, 2));
      await loadIssues(token);
    } catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };

  const deleteIssue = async (issue) => {
    if (!window.confirm(`Delete ${issue.volume} (${issue.year}) and its ${issue.articles?.length || 0} article records?`)) return;
    setError(''); setNotice('');
    try { await api(`/admin/issues/${encodeURIComponent(issue.slug)}`, { method: 'DELETE', token }); await loadIssues(token); if (editingSlug === issue.slug) resetForm(); setNotice('Issue deleted.'); }
    catch (requestError) { setError(requestError.message); }
  };

  const logout = () => { sessionStorage.removeItem('insat-admin-token'); setToken(''); setAuthenticated(false); setIssues([]); resetForm(); };

  return <><Header /><main className="admin-page"><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> INSAT EDITORIAL OFFICE</div><div className="admin-heading"><div><h1>Issue <em>management.</em></h1><p>Create and update the issue archive and its article records.</p></div>{authenticated && <div className="admin-panel-actions"><a className="admin-secondary" href="/admin/submissions">Submission inbox ↗</a><button className="admin-secondary" onClick={logout}>Sign out</button></div>}</div>{!authenticated ? <form className="admin-login" onSubmit={login}><h2>Editorial access</h2><p>Enter the admin token configured for this journal.</p><label>Admin token<input type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} required /></label>{error && <div className="admin-error" role="alert">{error}</div>}<button className="admin-primary" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button><a href="/">← Return to issue archive</a></form> : <div className="admin-layout"><form className="admin-form" onSubmit={saveIssue}><div className="admin-form-heading"><h2>{editingSlug ? 'Edit issue' : 'Create an issue'}</h2>{editingSlug && <span>{editingSlug}</span>}</div><div className="admin-grid"><label>Volume<input value={form.volume || ''} onChange={(event) => setForm({ ...form, volume: event.target.value })} placeholder="Vol. 4 · Issue 1" required /></label><label>Year<input type="number" min="2000" max="2100" value={form.year || ''} onChange={(event) => setForm({ ...form, year: event.target.value })} required /></label><label>Type<select value={form.type || 'regular'} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="regular">Regular issue</option><option value="special">Special issue</option></select></label><label>Release date<input value={form.date || ''} onChange={(event) => setForm({ ...form, date: event.target.value })} placeholder="March 30, 2027" required /></label><label>Publication date for sorting<input type="date" value={form.publishedAt || ''} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} /></label><label>Issue period<input value={form.period || ''} onChange={(event) => setForm({ ...form, period: event.target.value })} placeholder="October 2026 — March 2027" required /></label><label>Issue title<input value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="The March edition" required /></label><label>Subtitle<input value={form.subtitle || ''} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} placeholder="Special theme, if applicable" /></label><label className="admin-wide">Editor or issue description<textarea rows="2" value={form.descriptor || ''} onChange={(event) => setForm({ ...form, descriptor: event.target.value })} placeholder="Guest editor details or issue description" /></label><label className="admin-wide">Article records <span>JSON array: category, title, authors, pages (optional)</span><textarea className="json-editor" rows="13" value={articleText} onChange={(event) => setArticleText(event.target.value)} spellCheck="false" /></label></div>{error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}<div className="admin-actions"><button className="admin-primary" disabled={busy}>{busy ? 'Saving…' : editingSlug ? 'Save changes' : 'Create issue'}</button><button className="admin-secondary" type="button" onClick={resetForm}>New issue</button></div></form><section className="admin-issues"><div className="admin-list-heading"><h2>Published issues</h2><span>{issues.length} records</span></div>{issues.map((issue) => <article className="admin-issue-row" key={issue.slug}><div><strong>{issue.volume} · {issue.year}</strong><span>{issue.title}</span><small>{issue.articles?.length || 0} articles · {issue.type}</small></div><div><button onClick={() => editIssue(issue)}>Edit</button><button className="admin-delete" onClick={() => deleteIssue(issue)}>Delete</button></div></article>)}</section></div>}</main><Footer /></>;
}

export default function App() {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const pageTitles = { '/': 'Natural Sciences and Applied Technology', '/about': 'About | INSAT', '/research': 'Research | INSAT', '/people': 'People | INSAT', '/journals': 'Journals | INSAT', '/for-authors': 'For authors | INSAT', '/issues': 'Issues | INSAT', '/special-issues': 'Special issues | INSAT', '/engage': 'Engage | INSAT', '/announcements': 'Announcements | INSAT', '/media': 'Media | INSAT', '/contact': 'Contact | INSAT', '/account': 'Author account | INSAT', '/admin': 'Editorial admin | INSAT', '/admin/submissions': 'Submission inbox | INSAT' };
  useEffect(() => { document.title = menuPages[currentPath] ? `${menuPages[currentPath][0]} | INSAT` : pageTitles[currentPath] || pageTitles['/']; }, [currentPath]);
  if (currentPath === '/admin/submissions') return <AdminSubmissionQueue />;
  if (window.location.pathname.startsWith('/admin')) return <AdminPanel />;
  if (currentPath === '/account') return <><Header /><main id="top"><AccountPage /></main><Footer /></>;
  if (window.location.pathname.startsWith('/article/')) return <><Header /><ArticlePage /><Footer /></>;
  if (menuPages[currentPath]) {
    const [title, description] = menuPages[currentPath];
    return <><Header /><main id="top"><InteriorHero eyebrow="INSAT / EXPLORE" title={title} emphasis="at INSAT." description={description} /><section className="editorial-page institute-page"><div className="editorial-lead"><span className="editorial-index">INSAT / {title.toUpperCase()}</span><div><h2>{title}</h2><p>{description}</p><p>For more information, contact the Institute of Natural Sciences and Applied Technology or explore the related INSAT pages.</p></div></div><div className="author-grid"><article className="author-card"><span>LEARN MORE</span><h3>Explore INSAT</h3><p>Discover research, publications, people, and opportunities across the institute.</p><a href="/research">Research at INSAT ↗</a></article><article className="author-card"><span>JOURNALS</span><h3>Read the archive</h3><p>Browse the Natural Sciences and Applied Technology journal and published issues.</p><a href="/issues">Browse journal issues ↗</a></article><article className="author-card"><span>CONTACT</span><h3>Connect with us</h3><p>Send questions and enquiries to the INSAT office in Kolkata.</p><a href="/contact">Contact INSAT ↗</a></article></div></section></main><Footer /></>;
  }
  let page;
  switch (currentPath) {
    case '/about': page = <AboutPage />; break;
    case '/research': page = <InstitutePage page={institutePages['/research']} />; break;
    case '/people': page = <InstitutePage page={institutePages['/people']} />; break;
    case '/journals':
    case '/issues': page = <><InteriorHero eyebrow="THE JOURNAL ARCHIVE" title="Every issue, in" emphasis="one place." description="Search article titles and authors, browse by year, and explore every edition in the archive." /><IssueArchive /></>; break;
    case '/for-authors': page = <AuthorsPage />; break;
    case '/special-issues': page = <SpecialIssuesPage />; break;
    case '/engage': page = <InstitutePage page={institutePages['/engage']} />; break;
    case '/announcements': page = <InstitutePage page={institutePages['/announcements']} />; break;
    case '/media': page = <InstitutePage page={institutePages['/media']} />; break;
    case '/contact': page = <ContactPage />; break;
    default: page = <HomePage />;
  }
  return <><Header /><main id="top">{page}</main><Footer /></>;
}

