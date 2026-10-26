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

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const links = [['Home', '/'], ['About the journal', '/about'], ['For authors', '/for-authors'], ['Issues', '/issues'], ['Special issues', '/special-issues'], ['Contact', '/contact']];
  return <><div className="topline"><div className="topline-links"><a href="/">Home</a><a href="/about">About the journal</a><a href="/for-authors">For authors</a><a href="/contact">Contact</a></div><span>Peer reviewed · Open access · ISSN 3049-4206</span></div><header className="site-header"><Brand /><button className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button><nav className={`main-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">{links.map(([label, href]) => <a key={href} className={currentPath === href ? 'nav-active' : ''} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav><div className="header-actions"><a className="editor-login" href="/admin">Editorial login</a><a className="submit-link" href="mailto:office.insat@gmail.com?subject=INSAT%20Manuscript%20Submission">Submit a paper <span>↗</span></a></div></header></>;
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
  const shownIssues = compact ? issues.slice(0, 3) : issues;

  return <><section className={`issue-section ${compact ? 'compact-archive' : ''}`} id="issues"><div className="section-heading"><div><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" />{compact ? 'LATEST FROM THE JOURNAL' : specialOnly ? 'THEMED EDITIONS' : 'BROWSE THE ARCHIVE'}</div><h2>{compact ? <>Fresh research, <em>in context.</em></> : specialOnly ? <>Special issues, <em>new perspectives.</em></> : <>Every issue, <em>one place.</em></>}</h2></div><p>{compact ? 'Read the latest multidisciplinary research from the INSAT archive.' : specialOnly ? 'Focused collections bring researchers together around a shared question.' : 'Follow a subject, explore an edition, or search the complete archive.'}</p></div>{!compact && <div className="archive-tools"><label className="search-box"><span className="search-icon" aria-hidden="true" /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search titles, authors, topics..." autoComplete="off" /><kbd>/</kbd></label><label className="select-wrap"><span className="sr-only">Filter by year</span><select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All years</option>{availableYears.map((item) => <option value={item} key={item}>{item}</option>)}</select><span className="select-chevron">⌄</span></label><div className="view-switch" role="group" aria-label="Issue type"><button className={`view-btn ${type === 'all' ? 'selected' : ''}`} onClick={() => setType('all')}>All issues</button><button className={`view-btn ${type === 'special' ? 'selected' : ''}`} onClick={() => setType(type === 'special' ? 'all' : 'special')}>Special issues <span className="special-count">{String(issues.filter((issue) => issue.type === 'special').length).padStart(2, '0')}</span></button></div></div>}<div className="results-line"><span aria-live="polite">{loading ? 'LOADING ISSUE ARCHIVE…' : compact ? 'RECENT EDITIONS' : `${String(issues.length).padStart(2, '0')} ${issues.length === 1 ? 'ISSUE' : 'ISSUES'} FOUND`}</span><span>{usingPreview ? 'PREVIEW CONTENT · LIVE ARCHIVE CONNECTS WHEN AVAILABLE' : 'Sorted by publication date'} <span className="sort-arrow">↓</span></span></div><div className="issue-list">{shownIssues.map((issue, index) => <article className={`issue-card ${issue.type === 'special' ? 'is-special' : ''}`} key={issue._id || issue.slug}><IssueCover issue={issue} /><div className="issue-main"><div className="issue-kicker"><span className="issue-volume">{issue.volume} ({issue.year})</span><span className="issue-type">{issue.type === 'special' ? 'Special issue' : 'Regular issue'}</span></div><h3 className="issue-title">{issue.title}</h3>{issue.subtitle && <div className="issue-theme">{issue.subtitle}</div>}<div className="issue-date">{issue.period} · Released {issue.date}</div></div><div className="issue-detail"><strong>{issue.type === 'special' ? 'Guest editor' : 'In this issue'}</strong><div className="issue-authors">{issue.descriptor}</div><div className="issue-stats"><span>{issue.articles?.length || 0} featured papers</span><span>·</span><span>Open access</span></div></div><div className="issue-action"><button type="button" onClick={() => setSelected(issue)} aria-label={`Browse ${issue.volume} contents`}>Browse contents <span>↗</span></button><small>{String(issues.length - index).padStart(2, '0')} / {String(issues.length).padStart(2, '0')}</small></div></article>)}</div>{!loading && !shownIssues.length && <div className="empty-state"><span>↗</span><h3>No issues found</h3><p>Try a different search term or year.</p><button onClick={reset}>Clear filters</button></div>}{compact && <a className="text-link archive-more" href="/issues">Browse the complete archive <span>↗</span></a>}</section><IssueDialog issue={selected} onClose={() => setSelected(null)} /></>;
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

function Footer() {
  return <><section className="callout"><div className="callout-index">05 <span>—</span> 26</div><div><div className="eyebrow light-eyebrow"><span className="eyebrow-line" /> CALL FOR PAPERS</div><h2>Have a question worth<br /><em>bringing into focus?</em></h2><p>INSAT welcomes original research, reviews, short communications, and special issue proposals across disciplines.</p><a className="button-light" href="mailto:office.insat@gmail.com?subject=INSAT%20Special%20Issue%20Proposal">Propose a special issue <span>↗</span></a></div><div className="callout-mark" aria-hidden="true"><span>+</span><span>×</span><span>+</span><span>×</span></div></section><section className="contact-strip"><div><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> PUBLISHED BY INSAT</div><h2>Research belongs<br />in the conversation.</h2></div><div className="contact-info"><p>Institute of Natural Sciences and Applied Technology<br />Flat F, 1/55, Bijaygarh, Jadavpur, Kolkata 700032,<br />West Bengal, India</p><a href="mailto:office.insat@gmail.com">office.insat@gmail.com <span>↗</span></a></div><div className="contact-info contact-phone"><span>EDITORIAL OFFICE</span><a href="tel:+917699787147">+91 7699787147</a><a href="tel:+919748547109">+91 9748547109</a></div></section><footer className="site-footer"><a className="footer-brand" href="#top">INS<span>AT</span></a><span>© 2026 Institute of Natural Sciences and Applied Technology</span><a href="https://www.insat-res.in/">insat-res.in ↗</a><a href="/admin">Editorial admin ↗</a></footer></>;
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

  return <><Header /><main className="admin-page"><div className="eyebrow dark-eyebrow"><span className="eyebrow-line" /> INSAT EDITORIAL OFFICE</div><div className="admin-heading"><div><h1>Issue <em>management.</em></h1><p>Create and update the issue archive and its article records.</p></div>{authenticated && <button className="admin-secondary" onClick={logout}>Sign out</button>}</div>{!authenticated ? <form className="admin-login" onSubmit={login}><h2>Editorial access</h2><p>Enter the admin token configured for this journal.</p><label>Admin token<input type="password" autoComplete="current-password" value={token} onChange={(event) => setToken(event.target.value)} required /></label>{error && <div className="admin-error" role="alert">{error}</div>}<button className="admin-primary" disabled={busy}>{busy ? 'Checking…' : 'Sign in'}</button><a href="/">← Return to issue archive</a></form> : <div className="admin-layout"><form className="admin-form" onSubmit={saveIssue}><div className="admin-form-heading"><h2>{editingSlug ? 'Edit issue' : 'Create an issue'}</h2>{editingSlug && <span>{editingSlug}</span>}</div><div className="admin-grid"><label>Volume<input value={form.volume || ''} onChange={(event) => setForm({ ...form, volume: event.target.value })} placeholder="Vol. 4 · Issue 1" required /></label><label>Year<input type="number" min="2000" max="2100" value={form.year || ''} onChange={(event) => setForm({ ...form, year: event.target.value })} required /></label><label>Type<select value={form.type || 'regular'} onChange={(event) => setForm({ ...form, type: event.target.value })}><option value="regular">Regular issue</option><option value="special">Special issue</option></select></label><label>Release date<input value={form.date || ''} onChange={(event) => setForm({ ...form, date: event.target.value })} placeholder="March 30, 2027" required /></label><label>Publication date for sorting<input type="date" value={form.publishedAt || ''} onChange={(event) => setForm({ ...form, publishedAt: event.target.value })} /></label><label>Issue period<input value={form.period || ''} onChange={(event) => setForm({ ...form, period: event.target.value })} placeholder="October 2026 — March 2027" required /></label><label>Issue title<input value={form.title || ''} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="The March edition" required /></label><label>Subtitle<input value={form.subtitle || ''} onChange={(event) => setForm({ ...form, subtitle: event.target.value })} placeholder="Special theme, if applicable" /></label><label className="admin-wide">Editor or issue description<textarea rows="2" value={form.descriptor || ''} onChange={(event) => setForm({ ...form, descriptor: event.target.value })} placeholder="Guest editor details or issue description" /></label><label className="admin-wide">Article records <span>JSON array: category, title, authors, pages (optional)</span><textarea className="json-editor" rows="13" value={articleText} onChange={(event) => setArticleText(event.target.value)} spellCheck="false" /></label></div>{error && <div className="admin-error" role="alert">{error}</div>}{notice && <div className="admin-notice" role="status">{notice}</div>}<div className="admin-actions"><button className="admin-primary" disabled={busy}>{busy ? 'Saving…' : editingSlug ? 'Save changes' : 'Create issue'}</button><button className="admin-secondary" type="button" onClick={resetForm}>New issue</button></div></form><section className="admin-issues"><div className="admin-list-heading"><h2>Published issues</h2><span>{issues.length} records</span></div>{issues.map((issue) => <article className="admin-issue-row" key={issue.slug}><div><strong>{issue.volume} · {issue.year}</strong><span>{issue.title}</span><small>{issue.articles?.length || 0} articles · {issue.type}</small></div><div><button onClick={() => editIssue(issue)}>Edit</button><button className="admin-delete" onClick={() => deleteIssue(issue)}>Delete</button></div></article>)}</section></div>}</main><Footer /></>;
}

export default function App() {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  const pageTitles = { '/': 'Natural Sciences and Applied Technology', '/about': 'About the journal | INSAT', '/for-authors': 'For authors | INSAT', '/issues': 'Issues | INSAT', '/special-issues': 'Special issues | INSAT', '/contact': 'Contact | INSAT', '/admin': 'Editorial admin | INSAT' };
  useEffect(() => { document.title = pageTitles[currentPath] || pageTitles['/']; }, [currentPath]);
  if (window.location.pathname.startsWith('/admin')) return <AdminPanel />;
  if (window.location.pathname.startsWith('/article/')) return <><Header /><ArticlePage /><Footer /></>;
  let page;
  switch (currentPath) {
    case '/about': page = <AboutPage />; break;
    case '/for-authors': page = <AuthorsPage />; break;
    case '/issues': page = <><InteriorHero eyebrow="THE JOURNAL ARCHIVE" title="Every issue, in" emphasis="one place." description="Search article titles and authors, browse by year, and explore every edition in the archive." /><IssueArchive /></>; break;
    case '/special-issues': page = <SpecialIssuesPage />; break;
    case '/contact': page = <ContactPage />; break;
    default: page = <HomePage />;
  }
  return <><Header /><main id="top">{page}</main><Footer /></>;
}

