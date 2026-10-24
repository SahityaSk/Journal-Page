const issues = [
  {
    id: 'v3i2', volume: 'Vol. 3 · Issue 2', year: 2026, type: 'regular', date: 'September 30, 2026', period: 'April 2026 — September 2026', cover: 'cover-green', title: 'The September edition', subtitle: '', descriptor: 'Multidisciplinary research', articles: [
      {category:'Engineering & Technology',title:'A Due Diligence Study on the Factors That Matter For Successful Implementation of Metro Rail Projects from Indian Context',authors:'Sunil Kumar K; Soundaria, S.M.',pages:'1–39'},
      {category:'Engineering & Technology',title:'From Ratings to Sensors: Real-Time AIIoT-Based Credibility Anchored on Blockchain for Ride-Sharing Ecosystems',authors:'Chaudhary, Poonam; Madhur; Kandacharam, Sneha; et al.',pages:'40–71'},
      {category:'Engineering & Technology',title:'A System Dynamics-Based Multi-Objective Optimisation Framework for Interstate Reservoir Operations: Evidence from the Parambikulam-Aliyar Project, India',authors:'Thiagaraj, N; Natarajan, Balsundaram; M, Gunasekaran; et al.',pages:'72–104'},
      {category:'AI & ML',title:'A Comparative Study of QAOA and Classical Metaheuristics for Inventory Optimization',authors:'Chaudhary, Poonam; Singh, Pranav; Kandacharam, Sneha; et al.',pages:'105–127'},
      {category:'AI & ML',title:'K-Means Clustering of Arrival Estimates in a 2D Signal Using DCONVNET',authors:'Pradeep Semwal; Talwar, Apoorva; Kumar, Vineet; et al.',pages:'128–137'},
      {category:'AI & ML',title:'An Interpretable AutoML-Based Ensemble Framework with Fuzzy Feature Ranking for Cervical Cancer Risk Prediction',authors:'Saranya Aranganathan; Subban, Ravi; Kowsalya, R.',pages:'138–160'},
      {category:'AI & ML',title:'Machine Learning-Based Customer Lifetime Value Prediction in E-Commerce: A Comparative Study of Regression, Ensemble and Neural Models',authors:'Kumari, Deepika; Kondaka, Lakshmisudha; Kumar Singh, Santosh; et al.',pages:'161–173'},
      {category:'Biological Sciences',title:'Isolation and Functional Characterization of Biosurfactant-Producing Bacteria with Multiple Plant Growth-Promoting Traits from Petroleum-Contaminated Soil',authors:'Patil, Trupti; Nallanchakravarthula, Srivathsa',pages:'190–203'},
      {category:'Biological Sciences',title:'Photocatalytic Efficiency and Environmental Safety Assessment of Graphene Oxide for Sustainable Wastewater Treatment',authors:'Panchal, Sonal; Mahla, Pritiben',pages:'204–215'},
      {category:'Biological Sciences',title:'Physical Constraints in Molecular Communication: 2D Diffusion in Stiff and Crowded Hydrogels',authors:'Verma, Mayank; Goel, Priya',pages:'216–225'},
      {category:'Computer Science',title:'A Novel Information-Theoretic Measure for Feature Selection in High-Dimensional Data',authors:'Sharma, Ridhi; Kumar, Ashok',pages:'317–336'},
      {category:'Computer Science',title:'IoT-AI Framework for Smart Reverse Osmosis Water Purification and Distribution',authors:'Choudhury, Siddharth; Pandey, Anish; Mishra, Ruby',pages:'337–354'},
      {category:'Computer Science',title:'FedTrust-GNN: Federated Learning with Blockchain Trust and Graph Neural Networks for Decentralized Modeling',authors:'Sourish Dey; Pandey, Anish; Neogi, Shreyanjan; et al.',pages:'355–377'},
      {category:'Data Science',title:'Predicting Barriers to Talent Management Implementation in Saudi Universities: A Stochastic Modeling Approach',authors:'Subbarayalu, Arun Vijay; Raman, Vinoth; Goparaju, Anumolu',pages:'397–410'},
      {category:'Environmental Science',title:'Phytoremediation of Secondary Treated Sewage through Constructed Wetland',authors:'Yadava, Pramod; Verma, Shrikant',pages:'467–483'},
      {category:'Mathematical Sciences',title:'Analysis of Variable Order Fractional Derivative for FitzHugh-Nagumo Model with Mittag-Leffler Kernel',authors:'T, Devi; Venkatachalam, K.; M, Asick Ali; et al.',pages:'518–532'},
      {category:'Medical Sciences',title:'Q-SPAP: Quality-Guided Adaptive Stain-Preserving Preprocessing for Automated Cervical Cytology Classification',authors:'Saranya Aranganathan; Subban, Ravi; Kowsalya, Rangasamy',pages:'607–636'},
      {category:'Public Health',title:'Food Labelling Knowledge and Practice among Urban Households in Puducherry: A Cross-Sectional Study',authors:'Nagavalli, V; V, Sudha; K, Sevvanthi; et al.',pages:'751–764'},
      {category:'Renewable Energy',title:'Experimental Evaluation of a Recycled-Material Vertical Axis Wind Turbine (VAWT) with Passive Directional Flap Mechanism',authors:'Mandal, Amit',pages:'831–846'},
      {category:'Sustainable Development',title:'SDG Research Beyond Labelling: Coverage, Contribution, Uptake, and Sustainability (2015–2025)',authors:'Srivastava, Prerna; Sharma, Kuldip; Sachdeva, Sarveen Kaur; et al.',pages:'875–892'}
    ]
  },
  {
    id: 'v3i1s', volume: 'Vol. 3 · Issue 1S', year: 2026, type: 'special', date: 'February 28, 2026', period: 'Special issue · 2026', cover: 'cover-special', title: 'Advances in Plasma Physics', subtitle: 'From Theory to Technological Applications', descriptor: 'Guest edited by Prof. Suraj Kumar Sinha · Department of Physics, Pondicherry University, India', articles: [
      {category:'Plasma Physics',title:'Laser-Driven Acoustic Instabilities In Materials With Strain-Dependent Dielectric Constants In Quantum Plasma',authors:'Surabhi Chourey, Sanjay Dixit, Manisha Raghuvanshi'},
      {category:'Plasma Physics',title:'To Study of Alfvén Waves in Multi Ions Plasma Using Particle Aspects Approach',authors:'Mahendra Ahirwar, B. D. Raikwar, Radha Tamrakar'},
      {category:'Plasma Physics',title:'Finite-Resistivity Effects on Jeans Instability in Quantum Dusty Plasmas',authors:'Shweta Jain and Prerana Sharma'},
      {category:'Plasma Physics',title:'Effect of Viscosity Tensor on the Self-gravitational Instability of Rotating Anisotropic Plasma Propagating Along Transverse Direction',authors:'Vinayak Chouhan and Prerana Sharma'},
      {category:'Plasma Physics',title:'Face-to-face Interactions of Breathers in Electron-Ion Plasma with the Critical Composition of an Electron Beam',authors:'Prasanta Chatterjee and Jayshree Mondal'},
      {category:'Plasma Physics',title:'Parametric Instabilities in Semiconducting Quantum Plasma with Effect of Fermi Pressure and Bohm Potential',authors:'Kamni Pawar and Sanjay Dixit'},
      {category:'Plasma Physics',title:'Exact Solution of the (2+1)-Dimensional Damping Forcing Coupled Burgers Equation by Using Darboux Transformation',authors:'Prasanta Chatterjee, Dipan Saha, Nanda Kanan Pal and Santanu Raut'},
      {category:'Plasma Physics',title:'Enhancement of Nitrogen Fixation in Soil Using Corona Discharge',authors:'Ekta Yadav, Smrutishree Pratihary, R Arokiamary, Suraj Kumar Sinha'},
      {category:'Plasma Physics',title:'Field-Theoretic Structure of Momentum Transport in Plasma Channel Flow',authors:'Prabhat Singh, Abhishek Yadav, Aakanksha Singh and Punit Kumar'},
      {category:'Plasma Physics',title:'Linear and Nonlinear Dispersion Relations for Torsional Alfvén Waves in Solar Magnetic Flux Tubes',authors:'Pooja and Sukhdeep Kaur'},
      {category:'Plasma Physics',title:'Gravitational Instability and Collapse in Dusty Plasma Clouds: A Modified Jeans Analysis',authors:'Rabindra Mahato and Barjinder Kaur'}
    ]
  },
  {
    id: 'v3i1', volume: 'Vol. 3 · Issue 1', year: 2026, type: 'regular', date: 'March 30, 2026', period: 'October 2025 — March 2026', cover: 'cover-blue', title: 'The March edition', subtitle: '', descriptor: 'Research across science, society, and technology', articles: [
      {category:'Physical Sciences',title:'The Shannon-Gibbs Entropy and the Effective Boltzmann Constant in Curved Space',authors:'Hector Gerardo Flores and Maria Isabel Gonçalvez de Souza'},
      {category:'Physical Sciences',title:'Study of Fusion Cross Section of 3He(α,γ)7Be and 3He(3He,2p)4He Reactions at Astrophysical Energy Using Double Folding Model Potential',authors:'Nur Mohammad'},
      {category:'Engineering & Technology',title:'Reducing the Carbon Footprint Through Innovative Cooking Vessels',authors:'Krishnamurthy L. Bhat and Vibha K. Bhat'},
      {category:'Environmental Science',title:'Reviving Decaying Rivers: Case Studies from Indian Sundarbans',authors:'Karabi Das and Kanailal Das'},
      {category:'Social Sciences',title:'Interweaving Architecture and Performance: A Study of Tangible and Intangible Heritage in Purisai',authors:'Balasaravika Mathivanan'},
      {category:'Sustainable Development',title:'Sacred Shelters: Hindu Temple Architecture as Disaster Resilience Infrastructure Through Vāstu Vijñānam',authors:'JayaKrishna Babu, P V Rambabu, G Sri Kruti'},
      {category:'Engineering & Technology',title:'Watershed Management for Agricultural Development: A Case Study of Parekha Village, Dabhoi Taluka, Vadodara District, Gujarat',authors:'Chandani M. Jethva, Neha P. Bali, Ashish L. Guruji, Sandeep K. Kharva'},
      {category:'Social Sciences',title:'Transport Connectivity and Accessibility in Sacred Hamlets: A Case Study of Gujarat',authors:'Neha P. Bali, Chandani M. Jethva, Sandeep K. Kharva, Archan Bhangaonkar'},
      {category:'Mathematical Sciences',title:'Bhāskarācārya’s Theories on the Construction of the Sine',authors:'Girisha Bhat B'},
      {category:'Social Sciences',title:'Semantic Fitness Across Traditions: Nyāya’s Yogyatā and Contemporary Theories of Semantic Plausibility',authors:'Sayali Kare'}
    ]
  },
  {id:'v2i2',volume:'Vol. 2 · Issue 2',year:2025,type:'regular',date:'September 30, 2025',period:'April 2025 — September 2025',cover:'cover-sand',title:'The September edition',subtitle:'',descriptor:'Multidisciplinary research',articles:[
    {category:'Physical Sciences',title:'Probing First Sources Using Global 21cm Signal on Constraining Primordial Black Hole',authors:'S. Patra'},
    {category:'Physical Sciences',title:'Study of the fusion cross-section for some p-trapped reaction using single folding potential at low energy',authors:'N. Mohammad'},
    {category:'Medical Sciences',title:'Extended Depth of Focus Versus Monofocal Intraocular Lenses in Cataract Surgery: A Prospective Randomized Clinical Study of Visual and Patient-Reported Outcomes',authors:'A.K. Varshney et al.'},
    {category:'Physical Sciences',title:'Differential Configurational Entropy in Nonlinear Self-Similar Optical Rogue Wave',authors:'Pooja et al.'}
  ]},
  {id:'v2i1',volume:'Vol. 2 · Issue 1',year:2025,type:'regular',date:'March 30, 2025',period:'October 2024 — March 2025',cover:'cover-dark',title:'The March edition',subtitle:'',descriptor:'Research across disciplines',articles:[
    {category:'Physical Sciences',title:'Ion Acoustic Solitary Wave Formation in a Warm, Unmagnetized Dusty Plasma With Electron Inertia',authors:'R. Khanam et al.'},
    {category:'Social Sciences',title:'Comparative Analysis of Global Data Protection Models: Market-Driven, State-Driven, and Rights-Driven Approaches',authors:'S. Hossein'},
    {category:'Physical Sciences',title:'Black Hole RC Model: Calculating Dark Matter & Galaxy Rotation',authors:'H.G. Flores & I.G. de Souza'},
    {category:'Engineering & Technology',title:'Development Patterns and Transport Network Analysis across Wards in Howrah City for Urban Growth Estimation',authors:'A. Dutta et al.'}
  ]},
  {id:'v1i1',volume:'Vol. 1 · Issue 1',year:2024,type:'regular',date:'September 30, 2024',period:'April 2024 — September 2024',cover:'cover-blue',title:'The September edition',subtitle:'',descriptor:'The inaugural issue',articles:[
    {category:'Environmental Science',title:'Spatiotemporal Dynamics of Forest Cover in the Narmada River Basin: Insights from Enhanced Vegetation Index (1991–2021)',authors:'A. Dutta et al.'},
    {category:'Environmental Science',title:'Analysis of Methane Emissions in Alaska Permafrost Areas Using Sentinel-5P Data',authors:'S.A. Abdaly'},
    {category:'Biological Sciences',title:'Gut Microbiome and Its Association with Antibiotic Resistance: A Short Review for General Public Awareness',authors:'S. Bhowmick'},
    {category:'Physical Sciences',title:'Recent Advances in Sensors Applications Using AZO and GZO as Plasmonic Material in IR and NIR Frequency Region',authors:'S. Rajak'}
  ]}
];

const list = document.querySelector('#issue-list');
const searchInput = document.querySelector('#search');
const yearSelect = document.querySelector('#year-filter');
const resultCount = document.querySelector('#result-count');
const emptyState = document.querySelector('#empty-state');
const dialog = document.querySelector('#issue-dialog');
const dialogContent = document.querySelector('#dialog-content');
let activeType = 'all';

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const issueSearchText = (issue) => [issue.volume,issue.year,issue.type,issue.date,issue.period,issue.title,issue.subtitle,issue.descriptor,...issue.articles.flatMap(a=>[a.category,a.title,a.authors])].join(' ').toLowerCase();

function renderIssues(){
  const term = searchInput.value.trim().toLowerCase();
  const year = yearSelect.value;
  const visible = issues.filter(issue => (year==='all'||String(issue.year)===year) && (activeType==='all'||issue.type===activeType) && (!term||issueSearchText(issue).includes(term)));
  resultCount.textContent = `${String(visible.length).padStart(2,'0')} ${visible.length===1?'ISSUE':'ISSUES'} FOUND`;
  list.innerHTML = visible.map((issue,index)=>`<article class="issue-card ${issue.type==='special'?'is-special':''}">
    <div class="issue-cover ${issue.cover}" aria-label="Issue cover artwork"><span class="cover-label">NATURAL SCIENCES<br>& APPLIED TECH.</span><strong>${issue.volume.replace('Vol. ','V')}</strong><small>${issue.year} · INSAT</small></div>
    <div class="issue-main"><div class="issue-kicker"><span class="issue-volume">${escapeHtml(issue.volume)} (${issue.year})</span><span class="issue-type">${issue.type==='special'?'Special issue':'Regular issue'}</span></div><h3 class="issue-title">${escapeHtml(issue.title)}</h3>${issue.subtitle?`<div class="issue-theme">${escapeHtml(issue.subtitle)}</div>`:''}<div class="issue-date">${escapeHtml(issue.period)} · Released ${escapeHtml(issue.date)}</div></div>
    <div class="issue-detail"><strong>${issue.type==='special'?'Guest editor':'In this issue'}</strong><div class="issue-authors">${escapeHtml(issue.descriptor)}</div><div class="issue-stats"><span>${issue.articles.length} featured papers</span><span>·</span><span>Open access</span></div></div>
    <div class="issue-action"><button type="button" data-issue="${issue.id}" aria-label="Browse ${escapeHtml(issue.volume)} contents">Browse contents <span>↗</span></button><small>${String(issues.length-index).padStart(2,'0')} / 0${issues.length}</small></div>
  </article>`).join('');
  emptyState.hidden = visible.length!==0;
  list.hidden = visible.length===0;
}

function openIssue(id){
  const issue = issues.find(entry=>entry.id===id);
  if(!issue)return;
  const categorySequence = [...new Set(issue.articles.map(article=>article.category))];
  const content = categorySequence.map(category=>`<div class="article-group"><div class="dialog-toolbar"><span>${escapeHtml(category)}</span><span>${String(issue.articles.filter(a=>a.category===category).length).padStart(2,'0')} PAPERS</span></div><ol class="article-list">${issue.articles.filter(article=>article.category===category).map(article=>`<li class="article-row"><h3>${escapeHtml(article.title)}</h3><p>${escapeHtml(article.authors)}</p>${article.pages?`<span class="article-pages">Pages ${escapeHtml(article.pages)}</span>`:''}</li>`).join('')}</ol></div>`).join('');
  dialogContent.innerHTML = `<div class="dialog-head"><div class="eyebrow"><span class="eyebrow-line"></span>${issue.type==='special'?'SPECIAL ISSUE':'JOURNAL ISSUE'}</div><h2 id="dialog-title">${escapeHtml(issue.title)}</h2>${issue.subtitle?`<div class="dialog-subtitle">${escapeHtml(issue.subtitle)}</div>`:''}<div class="dialog-meta"><span>${escapeHtml(issue.volume)} · ${issue.year}</span><span>${escapeHtml(issue.date)}</span><span>Open access</span></div></div><div class="dialog-body">${content}${issue.type==='special'?`<div class="dialog-editor"><strong>Guest editor</strong><br>${escapeHtml(issue.descriptor)}</div>`:''}<div class="dialog-editor">Published by the Institute of Natural Sciences and Applied Technology, Kolkata. For article and submission enquiries, contact <a href="mailto:office.insat@gmail.com">office.insat@gmail.com</a>.</div></div>`;
  dialog.showModal();
}

const yearOptions=[...new Set(issues.map(issue=>issue.year))].sort((a,b)=>b-a);
yearOptions.forEach(year=>{const option=document.createElement('option');option.value=year;option.textContent=year;yearSelect.append(option);});
document.querySelector('.special-count').textContent=String(issues.filter(issue=>issue.type==='special').length).padStart(2,'0');
searchInput.addEventListener('input',renderIssues);
yearSelect.addEventListener('change',renderIssues);
document.querySelectorAll('.view-btn').forEach(button=>button.addEventListener('click',()=>{activeType=button.dataset.type;document.querySelectorAll('.view-btn').forEach(item=>item.classList.toggle('selected',item===button));renderIssues();}));
list.addEventListener('click',event=>{const button=event.target.closest('[data-issue]');if(button)openIssue(button.dataset.issue);});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
document.querySelector('#reset-filters').addEventListener('click',()=>{searchInput.value='';yearSelect.value='all';activeType='all';document.querySelectorAll('.view-btn').forEach(button=>button.classList.toggle('selected',button.dataset.type==='all'));renderIssues();});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!dialog.open){event.preventDefault();searchInput.focus();}});
const menuToggle=document.querySelector('.menu-toggle');
menuToggle.addEventListener('click',()=>{const open=menuToggle.getAttribute('aria-expanded')==='true';menuToggle.setAttribute('aria-expanded',String(!open));document.querySelector('.main-nav').classList.toggle('is-open',!open);});
document.querySelectorAll('.main-nav a').forEach(link=>link.addEventListener('click',()=>{document.querySelector('.main-nav').classList.remove('is-open');menuToggle.setAttribute('aria-expanded','false');}));
renderIssues();
