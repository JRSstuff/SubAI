import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas to dynamically compute and print 'Page X of Y' 
    along with running header and footer rules.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        page_width, page_height = letter
        margin_x = 44
        header_y = page_height - 34
        footer_y = 32

        # Header (pages after cover/first page)
        if self._pageNumber > 1:
            self.setFont('Helvetica-Bold', 8)
            self.setFillColor(colors.HexColor('#0284C7'))
            self.drawString(margin_x, header_y, "SubAI CDO")
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748B'))
            self.drawString(margin_x + 78, header_y, "| Concept Paper Technical Briefing & System Architecture")
            self.drawRightString(page_width - margin_x, header_y, "PROJECT REFERENCE MEMORANDUM")
            
            # Header line
            self.setStrokeColor(colors.HexColor('#E2E8F0'))
            self.setLineWidth(0.75)
            self.line(margin_x, header_y - 5, page_width - margin_x, header_y - 5)

        # Footer (all pages)
        self.setStrokeColor(colors.HexColor('#E2E8F0'))
        self.setLineWidth(0.75)
        self.line(margin_x, footer_y + 11, page_width - margin_x, footer_y + 11)

        self.setFont('Helvetica', 7.5)
        self.setFillColor(colors.HexColor('#64748B'))
        self.drawString(margin_x, footer_y, "SubAI CDO: Monsoon Drainage Triage & Verified Plastic Recovery | CEIW 2026")
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(page_width - margin_x, footer_y, page_text)
        self.restoreState()


def build_pdf(filename="SubAI_CDO_Concept_Paper_Briefing.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=44,
        rightMargin=44,
        topMargin=46,
        bottomMargin=48
    )

    content_width = letter[0] - 88 # 524 pt
    styles = getSampleStyleSheet()

    # Brand Colors
    c_primary = colors.HexColor('#0F172A')     # Slate 900
    c_blue = colors.HexColor('#0284C7')        # Ocean Blue 600
    c_blue_dark = colors.HexColor('#0369A1')   # Ocean Blue 700
    c_blue_light = colors.HexColor('#E0F2FE')  # Sky 100
    c_green = colors.HexColor('#059669')       # Emerald 600
    c_green_dark = colors.HexColor('#065F46')  # Emerald 800
    c_eco_bg = colors.HexColor('#ECFDF5')      # Emerald 50
    c_muted = colors.HexColor('#475569')       # Slate 600
    c_border = colors.HexColor('#CBD5E1')      # Slate 300
    c_bg_light = colors.HexColor('#F8FAFC')    # Slate 50
    c_callout_bg = colors.HexColor('#F0F9FF')  # Sky 50

    # Custom typography styles
    title_badge_style = ParagraphStyle(
        'DocBadge',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=c_blue_dark,
        alignment=0,
        spaceAfter=5
    )

    doc_title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=c_primary,
        alignment=0,
        spaceAfter=4
    )

    doc_subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=c_muted,
        alignment=0,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_blue_dark,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'BodyDark',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1E293B'),
        spaceAfter=5
    )

    body_bold = ParagraphStyle(
        'BodyDarkBold',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0F172A'),
        spaceAfter=4,
        keepWithNext=True
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#1E293B'),
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=2.5
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=colors.white,
        alignment=0
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#1E293B'),
        alignment=0
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10.5,
        textColor=colors.HexColor('#0F172A'),
        alignment=0
    )

    callout_text = ParagraphStyle(
        'CalloutText',
        fontName='Helvetica',
        fontSize=8,
        leading=11.5,
        textColor=colors.HexColor('#0F172A')
    )

    story = []

    # Helper: Callout Box
    def make_callout(text, bg_color=c_callout_bg, border_color=c_blue, text_style=callout_text):
        p = Paragraph(text, text_style)
        t = Table([[p]], colWidths=[content_width])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), bg_color),
            ('LINEBEFORE', (0,0), (0,-1), 3.5, border_color),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 9),
            ('RIGHTPADDING', (0,0), (-1,-1), 9),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        return t

    # Helper: Section Header with decorative underline
    def make_h1(title_text):
        p = Paragraph(title_text, h1_style)
        hr = HRFlowable(width="100%", thickness=1, color=c_blue, spaceBefore=2, spaceAfter=6)
        return [p, hr]

    # ==========================================
    # HEADER / COVER BANNER
    # ==========================================
    badge_html = "TECHNICAL SPECIFICATION &amp; CONCEPT PAPER BRIEFING MEMORANDUM &bull; REF: TL-CDO-2026-CPB"
    story.append(Paragraph(badge_html, title_badge_style))
    story.append(Paragraph("SubAI CDO: Closed-Loop Drainage Obstruction Triage, Verified Solid Waste Diversion, and Rainwater Reserves", doc_title_style))
    story.append(Paragraph("A Comprehensive System Concept, Operational Architecture, and Policy Briefing for Concept Paper Authors, Grant Proposals, and Institutional Stakeholders.", doc_subtitle_style))

    # Metadata Grid Table
    meta_data = [
        [
            Paragraph("<b>Target Program:</b> CEIW 2026 Green Innovation / DOST-PCIEERD", table_cell_style),
            Paragraph("<b>Target Geography:</b> Cagayan de Oro City (Misamis Oriental, Region X)", table_cell_style)
        ],
        [
            Paragraph("<b>Primary Domain:</b> Urban Drainage DRRM &amp; Circular Economy", table_cell_style),
            Paragraph("<b>Lead Deployment Pilot:</b> USTP CDO Campus &amp; Bitan-ag Creek Corridor", table_cell_style)
        ],
        [
            Paragraph("<b>Technology Stack:</b> Next.js 16, Supabase RLS, Gemini Vision AI, Leaflet GIS", table_cell_style),
            Paragraph("<b>Document Version:</b> 1.0 (Production Architecture Specification)", table_cell_style)
        ]
    ]
    t_meta = Table(meta_data, colWidths=[content_width*0.5, content_width*0.5])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_light),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 8))

    # ==========================================
    # 1. EXECUTIVE SUMMARY & CORE VALUE PROPOSITION
    # ==========================================
    story.extend(make_h1("1. Executive Summary &amp; Core Value Proposition"))
    
    p_exec = (
        "<b>SubAI CDO</b> is an integrated, mobile-first digital orchestration and physical chain-of-custody platform "
        "engineered to mitigate the chronic urban and campus monsoon flash-flooding crises across Cagayan de Oro City. "
        "The platform coordinates photographic obstruction reporting by citizens and students, executes automated multimodal "
        "Vision AI waste categorization, performs transparent risk-based triage dispatching, enforces verified on-site scale weighing "
        "by material fraction, and closes the loop through formal handovers to accredited Materials Recovery Facilities (MRFs) and recyclers."
    )
    story.append(Paragraph(p_exec, body_style))

    core_quote = (
        "<b>Core Operational Axiom:</b><br/>"
        "<i>&ldquo;Software ra atong product. Atong trabaho kay klarohon ang report, assignment ug evidence. "
        "Ang actual cleanup ug recycling kay sa participating campus personnel ug partner recyclers.&rdquo;</i><br/>"
        "(English translation: <i>Our software product provides absolute clarity in reporting, risk prioritization, task assignment, "
        "and physical chain-of-custody evidence. Physical desiltation, clearing, and recycling are executed by authorized campus personnel, "
        "LGU maintenance crews, and licensed recycling cooperatives.</i>)"
    )
    story.append(make_callout(core_quote, bg_color=c_callout_bg, border_color=c_blue))
    story.append(Spacer(1, 6))

    story.append(Paragraph("<b>Fundamental Value Pillars for Institutional Stakeholders:</b>", body_bold))
    story.append(Paragraph("&bull; <b>End-to-End Chain of Custody:</b> Eliminates undocumented ditch cleaning where scooped debris is abandoned on embankments and washed back into canals during the next downpour.", bullet_style))
    story.append(Paragraph("&bull; <b>Reconciled Mass Balance (Zero Greenwashing):</b> Mandates calibrated digital scale weighing (kg) segregated into PET, flexible films, silt/sediment, and organic fractions before disposal or MRF transfer.", bullet_style))
    story.append(Paragraph("&bull; <b>Sub-Second Low-Bandwidth Resilience:</b> Employs client-side canvas compression downscaling 8MB mobile camera uploads to ~120KB in &lt;100ms, enabling real-time operation over congested 3G/4G cellular networks.", bullet_style))
    story.append(Paragraph("&bull; <b>Integrated Stormwater Banking (Rain Bank):</b> Couples drainage clearing with rooftop rainwater catchment modeling to calculate volumetric peak-flow attenuation for campus and municipal facilities.", bullet_style))
    story.append(Spacer(1, 8))

    # ==========================================
    # 2. LOCAL PROBLEM CONTEXT: CAGAYAN DE ORO CITY
    # ==========================================
    story.extend(make_h1("2. Local Hydrological Context &amp; Drainage Bottlenecks in CDO"))
    
    p_cdo_ctx = (
        "Cagayan de Oro City, situated in Northern Mindanao along Macajalar Bay, is topographically characterized by steep "
        "mountainous headwaters draining through high-density coastal floodplains. The city has experienced devastating flood events, "
        "most notably Tropical Storm Sendong (Washi) in 2011, and continues to suffer severe recurring localized inundations during routine "
        "afternoon convective downpours and seasonal southwest monsoons (Habagat)."
    )
    story.append(Paragraph(p_cdo_ctx, body_style))

    p_hotspots = (
        "<b>Critical Urban Flood Hotspots and Chokepoints:</b><br/>"
        "1. <b>Bitan-ag Creek Drainage Corridor:</b> The critical urban drainage spine running through Camaman-an, Cogon Market, "
        "Claro M. Recto Avenue (Limketkai / USTP basin), Lapasan, and discharging into Macajalar Bay. It receives runoff from over "
        "1,200 hectares of dense urban watershed.<br/>"
        "2. <b>CM Recto / USTP Catchment Depression:</b> A notorious low-lying basin where arterial roads submerge under waist-deep water "
        "within 20 to 30 minutes of heavy precipitation, halting inter-city transit and endangering university students.<br/>"
        "3. <b>Carmen, Bulua, and Kauswagan Outfalls:</b> Major commercial and residential sub-basins whose subterranean box culverts and "
        "curb inlets are routinely paralyzed by unsegregated solid waste accumulation."
    )
    story.append(Paragraph(p_hotspots, body_style))
    story.append(Spacer(1, 4))

    # Comparison Table: Current Broken Practice vs SubAI
    cdo_problem_data = [
        [
            Paragraph("<b>Operational Dimension</b>", table_header_style),
            Paragraph("<b>Conventional Municipal / Campus Practice</b>", table_header_style),
            Paragraph("<b>SubAI Closed-Loop Architecture</b>", table_header_style)
        ],
        [
            Paragraph("<b>Incident Reporting</b>", table_cell_bold),
            Paragraph("Scattered citizen posts on social media or manual logbooks without GPS or structural metadata.", table_cell_style),
            Paragraph("Mobile PWA with automated Vision AI material tagging, GPS auto-center, and forced pin verification.", table_cell_style)
        ],
        [
            Paragraph("<b>Triage &amp; Prioritization</b>", table_cell_bold),
            Paragraph("Ad-hoc, subjective dispatching based on political noise or crisis complaints.", table_cell_style),
            Paragraph("Transparent mathematical index (0â€“5) combining obstruction severity, disruption impact, and wait time.", table_cell_style)
        ],
        [
            Paragraph("<b>Field Evidence</b>", table_cell_bold),
            Paragraph("No photo verification; work orders marked 'cleared' with zero objective visual proof.", table_cell_style),
            Paragraph("Mandatory Before &amp; After photo capture with side-by-side reviewer inspection and continuous zoom audit.", table_cell_style)
        ],
        [
            Paragraph("<b>Material Accounting</b>", table_cell_bold),
            Paragraph("Debris treated as unmeasured bulk 'garbage' dumped directly into landfills or left roadside.", table_cell_style),
            Paragraph("Calibrated scale weighing by fraction (kg of PET, film, silt, organic) with strict mass-balance accounting.", table_cell_style)
        ],
        [
            Paragraph("<b>Circular Handover</b>", table_cell_bold),
            Paragraph("Zero linkage to MRFs; recyclables contaminate waterways or municipal open disposal sites.", table_cell_style),
            Paragraph("Formal MRF custody transfer receipts; auditable diverted plastic mass telemetry with 1-click JSON export.", table_cell_style)
        ]
    ]
    t_prob = Table(cdo_problem_data, colWidths=[content_width*0.20, content_width*0.40, content_width*0.40], repeatRows=1)
    t_prob.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_blue_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
    ]))
    story.append(t_prob)
    story.append(Spacer(1, 10))

    # ==========================================
    # 3. FIVE-TIER ROLE-BASED ACCESS CONTROL (RBAC)
    # ==========================================
    story.extend(make_h1("3. Governance &amp; Five-Tier Role-Based Access Control (RBAC)"))
    
    p_rbac = (
        "SubAI enforces ironclad security boundaries and user segregation backed by PostgreSQL Row Level Security (RLS) "
        "and Next.js server-side route guards. Each stakeholder operates within a dedicated operational interface tailored "
        "to their institutional responsibilities:"
    )
    story.append(Paragraph(p_rbac, body_style))

    rbac_table_data = [
        [
            Paragraph("<b>Role</b>", table_header_style),
            Paragraph("<b>Primary Stakeholders</b>", table_header_style),
            Paragraph("<b>Allowed Route Scopes</b>", table_header_style),
            Paragraph("<b>Core System Responsibilities</b>", table_header_style)
        ],
        [
            Paragraph("<b>Reporter</b>", table_cell_bold),
            Paragraph("Citizens, university students, barangay tanods, campus occupants", table_cell_style),
            Paragraph("<code>/report</code><br/><code>/map</code>", table_cell_style),
            Paragraph("Submits photographic obstruction evidence, triggers Gemini AI material scan, verifies street pin via map, receives tracking receipt.", table_cell_style)
        ],
        [
            Paragraph("<b>Reviewer</b>", table_cell_bold),
            Paragraph("Campus maintenance supervisors, LGU CLENRO / CDRRMD dispatchers", table_cell_style),
            Paragraph("<code>/review</code><br/><code>/map</code><br/><code>/dashboard</code>", table_cell_style),
            Paragraph("Inspects unverified queue, executes 1.0xâ€“3.5x image zoom inspection, assigns 0â€“5 priority score, flags duplicates, dispatches work orders.", table_cell_style)
        ],
        [
            Paragraph("<b>Collector</b>", table_cell_bold),
            Paragraph("Authorized sanitation crew, physical plant maintenance, sweepers", table_cell_style),
            Paragraph("<code>/tasks</code><br/><code>/tasks/[id]</code><br/><code>/map</code>", table_cell_style),
            Paragraph("Navigates to site, performs physical clearing, logs mandatory Before/After photo evidence, inputs calibrated scale weights (kg) by material fraction.", table_cell_style)
        ],
        [
            Paragraph("<b>Recycler</b>", table_cell_bold),
            Paragraph("Accredited MRF operators, junk shop cooperatives, upcyclers", table_cell_style),
            Paragraph("<code>/dashboard</code><br/><code>/tasks</code><br/><code>/map</code>", table_cell_style),
            Paragraph("Inspects diverted batches of PET and clean plastics, signs digital custody transfer receipts, accepts net verified kilograms for circular processing.", table_cell_style)
        ],
        [
            Paragraph("<b>Admin</b>", table_cell_bold),
            Paragraph("University Director of Physical Plant, City Drainage Chief, System Engineer", table_cell_style),
            Paragraph("All routes (inc. <code>/admin</code>, <code>/rain-bank</code>)", table_cell_style),
            Paragraph("User role governance (promote/demote), campus site configuration, raw audit log inspection, CSV/JSON export, system telemetry monitoring.", table_cell_style)
        ]
    ]
    t_rbac = Table(rbac_table_data, colWidths=[content_width*0.13, content_width*0.25, content_width*0.20, content_width*0.42], repeatRows=1)
    t_rbac.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_blue_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
    ]))
    story.append(t_rbac)
    story.append(Spacer(1, 10))

    # ==========================================
    # 4. END-TO-END OPERATIONAL LIFECYCLE (THE 7-STEP CHAIN)
    # ==========================================
    story.extend(make_h1("4. The End-to-End Operational Lifecycle"))
    
    p_lifecycle = (
        "The SubAI lifecycle bridges community-driven detection with municipal accountability through a seven-step "
        "closed loop. Every physical event is mirrored by a cryptographically secured database transaction:"
    )
    story.append(Paragraph(p_lifecycle, body_style))

    # High-level flow banner
    flow_boxes = [
        [
            Paragraph("<b>1. Reporter</b><br/>Photo + AI Tag", table_cell_style),
            Paragraph("<b>2. Map GIS</b><br/>Hotspot Aggregation", table_cell_style),
            Paragraph("<b>3. Reviewer</b><br/>Triage &amp; Score", table_cell_style),
            Paragraph("<b>4. Collector</b><br/>Weigh &amp; Clear", table_cell_style),
            Paragraph("<b>5. Recycler</b><br/>MRF Handover", table_cell_style),
            Paragraph("<b>6. Admin</b><br/>Mass Balance", table_cell_style)
        ]
    ]
    t_flow = Table(flow_boxes, colWidths=[content_width/6]*6)
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_blue_light),
        ('BOX', (0,0), (-1,-1), 1, c_blue),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(t_flow)
    story.append(Spacer(1, 6))

    steps_text = [
        ("Step 1: Rapid Multimodal Photo Reporting (/report)",
         "A citizen or student encounters an obstructed canal or culvert. They snap a photo via direct camera or gallery. "
         "The browser instantly downscales the image via HTML5 Canvas (<100ms) and initiates an asynchronous Google Gemini Flash Lite "
         "vision cascade. Within ~1.5s, the AI categorizes dominant waste fractions (e.g., PET bottles, silt, organic waste). "
         "The user retains total manual control to add/remove custom material tags and classify the drainage type (Curb Inlet, Catch Basin, Open Canal, Box Culvert, Creek Outfall). "
         "The user pins the exact location on an interactive Leaflet map; OpenStreetMap Nominatim reverse geocodes coordinates to a human-readable street and barangay. "
         "Upon submission, a full-screen celebration confirms server synchronization and generates an auditable tracking receipt."),
        
        ("Step 2: Interactive GIS Hotspot Mapping (/map)",
         "Submitted reports immediately register on the central Leaflet GIS map. Markers are color-coded by operational status "
         "(Pending Verification = Amber, Dispatched/In Progress = Blue, Cleared = Emerald). GIS clustering aggregates dense urban areas "
         "(such as Cogon Market or Lapasan Highway), enabling dispatchers and city planners to spot macro-level drainage failures at a glance."),
        
        ("Step 3: Review, Image Inspection & Priority Scoring (/review)",
         "Maintenance dispatchers inspect incoming queues. To prevent misjudgments caused by tiny thumbnails, reviewers can click an "
         "inspection eye icon to open an evidence modal featuring 1.0x to 3.5x continuous image zoom and complete reporter notes. "
         "The reviewer confirms validity, filters out duplicates, and scores the incident using a transparent 0â€“5 priority index."),
        
        ("Step 4: Maintenance Work Order Execution (/tasks)",
         "The verified report converts into a field work order assigned to a specific cleaning crew. The crew accesses their mobile "
         "task dashboard, navigates to the GPS pin, and executes the physical clearing using appropriate tools (silt scoops, trash rakes)."),
        
        ("Step 5: Mandatory Dual-Photo Verification & Scale Weighing (/tasks/[id])",
         "The collection crew is strictly barred from closing a task without verifiable proof. They must upload an 'After' clearance photo "
         "taken from the identical vantage point and enter measured scale weights (kg) across segregated bins: PET Plastic, Flexible Packaging, "
         "Silt/Sediment, and Organic/Residual Waste. Qualitative estimates are strictly barred from numerical ledger sums."),
        
        ("Step 6: Recycler Custody Transfer & Handover Sign-Off (/dashboard)",
         "Recovered recyclable plastics are not dumped into landfills. They are routed to accredited local junk shops or barangay MRFs. "
         "The recycler verifies the weight on their own scale and signs off on the digital custody transfer, producing an auditable digital receipt."),
        
        ("Step 7: Reconciled Mass Balance & Public Telemetry (/dashboard & /rain-bank)",
         "The platform aggregates citywide data into an unassailable mass-balance ledger. The dashboard proves exactly how many kilograms "
         "were diverted from Macajalar Bay into circular manufacturing versus residual landfill disposal. Concurrently, the Rain Bank module "
         "models rooftop catchment volumes to relieve peak stormwater pressure during cloudbursts.")
    ]

    for title, desc in steps_text:
        story.append(Paragraph(f"<b>{title}</b>", body_bold))
        story.append(Paragraph(desc, bullet_style))
        story.append(Spacer(1, 2))

    story.append(Spacer(1, 8))

    # ==========================================
    # 5. TECHNICAL ARCHITECTURE & SOFTWARE STACK
    # ==========================================
    story.extend(make_h1("5. Technical Implementation &amp; Software Engineering"))
    
    p_tech = (
        "SubAI is architected as a resilient, production-ready enterprise Progressive Web App (PWA) built on modern "
        "Next.js 16 serverless infrastructure, Supabase PostgreSQL, and Google Gemini Multimodal AI. The system follows "
        "strict engineering tenets: zero client-side optimistic fabrication, server-verified truth, and zero UI gradients."
    )
    story.append(Paragraph(p_tech, body_style))

    tech_table_data = [
        [
            Paragraph("<b>Architecture Layer</b>", table_header_style),
            Paragraph("<b>Technology</b>", table_header_style),
            Paragraph("<b>Version / Specification</b>", table_header_style),
            Paragraph("<b>Operational Implementation in SubAI</b>", table_header_style)
        ],
        [
            Paragraph("<b>Application Framework</b>", table_cell_bold),
            Paragraph("Next.js App Router", table_cell_style),
            Paragraph("Next.js 16.4.2 / Turbopack", table_cell_style),
            Paragraph("Server Components, Server Actions for zero-leakage API calls, Route Handlers, automatic code-splitting.", table_cell_style)
        ],
        [
            Paragraph("<b>UI Runtime &amp; Lang</b>", table_cell_bold),
            Paragraph("React 19 / TypeScript 5", table_cell_style),
            Paragraph("React 19.3.0 / Strict TS", table_cell_style),
            Paragraph("Modern concurrent rendering, typed database schema interfaces, zero runtime type errors.", table_cell_style)
        ],
        [
            Paragraph("<b>Styling System</b>", table_cell_bold),
            Paragraph("Tailwind CSS v4", table_cell_style),
            Paragraph("Tailwind v4 (Zero Gradients)", table_cell_style),
            Paragraph("Official 4-color palette tokens (#30AFFF, #92EEFF, #D8FFC5, #C4F7CA), crisp border contrast, flat cards.", table_cell_style)
        ],
        [
            Paragraph("<b>Database &amp; Security</b>", table_cell_bold),
            Paragraph("Supabase PostgreSQL", table_cell_style),
            Paragraph("Postgres 15+ / SSR Cookies", table_cell_style),
            Paragraph("Row Level Security (RLS) policies, session-based auth via @supabase/ssr, immutable audit log tables.", table_cell_style)
        ],
        [
            Paragraph("<b>Multimodal Vision AI</b>", table_cell_bold),
            Paragraph("Google Gemini API", table_cell_style),
            Paragraph("gemini-3.5-flash-lite / flash-lite-latest", table_cell_style),
            Paragraph("Dual-model cascade with 6s timeout, structured JSON schema response, automatic human fallback.", table_cell_style)
        ],
        [
            Paragraph("<b>GIS &amp; Geocoding</b>", table_cell_bold),
            Paragraph("Leaflet &amp; OSM Nominatim", table_cell_style),
            Paragraph("Leaflet 1.9.4 / OSM Tiles", table_cell_style),
            Paragraph("Zero-cost open mapping, GPS coordinate capture, reverse geocoding to CDO streets and barangays.", table_cell_style)
        ],
        [
            Paragraph("<b>Client Processing</b>", table_cell_bold),
            Paragraph("HTML5 Canvas API", table_cell_style),
            Paragraph("Native Browser Canvas", table_cell_style),
            Paragraph("Pre-upload image downscaling to 960x960 @ 0.72 quality in <100ms; reduces upload payload by ~98%.", table_cell_style)
        ]
    ]
    t_tech = Table(tech_table_data, colWidths=[content_width*0.18, content_width*0.19, content_width*0.23, content_width*0.40], repeatRows=1)
    t_tech.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_blue_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
    ]))
    story.append(t_tech)
    story.append(Spacer(1, 8))

    story.append(Paragraph("<b>Low-Bandwidth Mobile Optimization Engine:</b>", body_bold))
    p_opt = (
        "In field disaster conditions or congested cellular environments (common along flooded corridors in CDO), standard 8MB to 12MB "
        "smartphone photographs fail to upload, causing critical report abandonment. SubAI implements an in-memory client-side "
        "HTML5 Canvas transformation pipeline. The raw bitmap is scaled to a bounding box of 960x960 pixels at 0.72 JPEG compression "
        "within 80 milliseconds on the user's device. The resulting ~120KB payload transmits reliably even over 2G/3G links and substantially "
        "reduces serverless inference latency on Google Gemini."
    )
    story.append(Paragraph(p_opt, body_style))

    story.append(Paragraph("<b>Gemini Multimodal Fast-Cascade Architecture:</b>", body_bold))
    p_ai = (
        "The backend AI engine (<code>src/lib/gemini.ts</code>) executes a hardened multi-tier strategy: it initiates a primary "
        "inference request to <code>gemini-3.5-flash-lite</code> with a strict 6.0-second timeout. If network degradation occurs or "
        "rate limits are met, it seamlessly cascades to <code>gemini-flash-lite-latest</code>. If all cloud AI endpoints are unreachable, "
        "the application degrades gracefully without breaking the user experience, falling back to manual chip selection."
    )
    story.append(Paragraph(p_ai, body_style))
    story.append(Spacer(1, 8))

    # ==========================================
    # 6. MATHEMATICAL FORMULATIONS & MASS-BALANCE TRUTH
    # ==========================================
    story.extend(make_h1("6. Mathematical Formulations &amp; Anti-Greenwashing Metrics"))
    
    p_math_intro = (
        "To satisfy rigorous academic, municipal, and international donor audit requirements, SubAI repudiates subjective claims. "
        "All triage rankings, recycling recovery rates, and rainwater offsets are derived from deterministic equations:"
    )
    story.append(Paragraph(p_math_intro, body_style))

    # Formula 1: Priority Scoring
    story.append(Paragraph("<b>A. Transparent Priority Triage Scoring Algorithm (Range: 0 to 5)</b>", body_bold))
    p_f1_desc = (
        "Verified drainage reports are assigned an integer priority score <i>P</i> evaluated as the sum of three independent variables:<br/>"
        "&bull; <b>Obstruction Score (S_obs in {0, 1, 2}):</b> 0 = Minimal debris; 1 = Partial constriction (&lt;50%); 2 = Total hydraulic blockage (&gt;50%).<br/>"
        "&bull; <b>Disruption Score (S_dis in {0, 1, 2}):</b> 0 = Low-impact ditch; 1 = Affects pedestrian walkway; 2 = Critical arterial road or campus entrance.<br/>"
        "&bull; <b>Time Decay Penalty (S_time in {0, 1}):</b> +1 if report has remained unassigned for &gt;48 hours post-verification; 0 otherwise."
    )
    story.append(Paragraph(p_f1_desc, body_style))
    story.append(make_callout(
        "<b>Priority Index Equation:</b>&nbsp;&nbsp;&nbsp;&nbsp;<b>P = S_obs + S_dis + S_time</b><br/>"
        "&bull; <b>P in [0, 1]:</b> <b>Low Priority</b> (Scheduled routine maintenance within 7 days)<br/>"
        "&bull; <b>P in [2, 3]:</b> <b>Medium Priority</b> (Active dispatch within 48 hours)<br/>"
        "&bull; <b>P in [4, 5]:</b> <b>High Priority</b> (Emergency rapid response within 6â€“12 hours)",
        bg_color=c_callout_bg, border_color=c_blue
    ))
    story.append(Spacer(1, 6))

    # Formula 2: Reconciled Mass Balance
    story.append(Paragraph("<b>B. Closed-Loop Mass Balance Reconciliation (Kilogram Accounting)</b>", body_bold))
    p_f2_desc = (
        "Greenwashing is prevented by enforcing strict mathematical equivalence between field collection scales and downstream disposition:"
    )
    story.append(Paragraph(p_f2_desc, body_style))
    story.append(make_callout(
        "<b>1. Total Wet Mass Collected:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>M_total = M_PET + M_film_plastic + M_silt + M_organic + M_residual</b><br/><br/>"
        "<b>2. Verified Circular Diversion Rate (Div_Rate %):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>Div_Rate % = ( M_accepted_MRF / M_total ) * 100%</b><br/><br/>"
        "<i>Rule: M_accepted_MRF is strictly populated ONLY when an authorized Recycler counter-signs a digital handover receipt. "
        "Unweighed estimations or unconfirmed batches remain classified as 'Awaiting Disposition' and are excluded from diversion claims.</i>",
        bg_color=c_eco_bg, border_color=c_green
    ))
    story.append(Spacer(1, 6))

    # Formula 3: Rain Bank Runoff Attenuation
    story.append(Paragraph("<b>C. Rain Bank Rooftop Stormwater Retention Model</b>", body_bold))
    p_f3_desc = (
        "The Rain Bank module models peak-flow runoff reduction by calculating harvestable volume from campus rooftops:"
    )
    story.append(Paragraph(p_f3_desc, body_style))
    story.append(make_callout(
        "<b>Harvested Stormwater Volume (Liters):</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;<b>V_harvested = A_roof (sq.m) * R_event (mm) * C_runoff * Filter_Efficiency</b><br/>"
        "<i>Where: A_roof = Catchment footprint in sq. meters; R_event = Localized precipitation depth (e.g. 50mm downpour); "
        "C_runoff = Surface runoff coefficient (0.90 for corrugated GI sheet / 0.85 for concrete tile); "
        "Filter_Efficiency = First-flush filter efficiency factor (typically 0.90).</i>",
        bg_color=c_bg_light, border_color=c_muted
    ))
    story.append(Spacer(1, 8))

    # ==========================================
    # 7. PILOT DEPLOYMENT FRAMEWORK & STAKEHOLDER MAPPING
    # ==========================================
    story.extend(make_h1("7. Pilot Implementation Framework: USTP &amp; Bitan-ag Corridor"))
    
    p_pilot = (
        "The initial deployment is tailored for the <b>CEIW 2026</b> Green Schools &amp; Learning challenge, establishing a live "
        "demonstration pilot anchored at the University of Science and Technology of Southern Philippines (USTP) Cagayan de Oro campus, "
        "coupled with the municipal drainage artery along Claro M. Recto Avenue."
    )
    story.append(Paragraph(p_pilot, body_style))

    # Stakeholder Matrix
    pilot_stakeholders = [
        [
            Paragraph("<b>Stakeholder Entity</b>", table_header_style),
            Paragraph("<b>Operational Role</b>", table_header_style),
            Paragraph("<b>Institutional Contribution &amp; Value Realized</b>", table_header_style)
        ],
        [
            Paragraph("<b>USTP CDO Administration &amp; Physical Plant Office (PPO)</b>", table_cell_bold),
            Paragraph("Campus Host &amp; Maintenance Execution", table_cell_style),
            Paragraph("Deploys ground maintenance sweepers as Collectors; uses SubAI to monitor 18 campus drainage catchments and curb inlets; protects USTP grounds from recurrent flood shutdown.", table_cell_style)
        ],
        [
            Paragraph("<b>USTP Student Council &amp; Engineering Orgs</b>", table_cell_bold),
            Paragraph("Civic Reporters &amp; Campus Monitors", table_cell_style),
            Paragraph("Organizes student reporting brigades; logs geotagged photos during heavy downpours; provides active user feedback on mobile UI.", table_cell_style)
        ],
        [
            Paragraph("<b>City Local Environment &amp; Natural Resources Office (CLENRO)</b>", table_cell_bold),
            Paragraph("LGU Solid Waste Authority", table_cell_style),
            Paragraph("Aligns collection telemetry with City Ecological Solid Waste Management programs; audits diversion rates from Bitan-ag Creek.", table_cell_style)
        ],
        [
            Paragraph("<b>City Disaster Risk Reduction &amp; Management Dept (CDRRMD)</b>", table_cell_bold),
            Paragraph("Flood Emergency Coordination", table_cell_style),
            Paragraph("Monitors real-time GIS map of severe drainage chokepoints along CM Recto Avenue during monsoon alerts to deploy flood extraction pumps.", table_cell_style)
        ],
        [
            Paragraph("<b>Accredited Junk Shops &amp; MRF Cooperatives (Lapasan/Puntod)</b>", table_cell_bold),
            Paragraph("Circular Recovery Offtakers", table_cell_style),
            Paragraph("Acts as certified Recyclers on the platform; receives sorted PET bottles and HDPE containers; signs digital transfer receipts for circular monetization.", table_cell_style)
        ]
    ]
    t_stakeholders = Table(pilot_stakeholders, colWidths=[content_width*0.28, content_width*0.22, content_width*0.50], repeatRows=1)
    t_stakeholders.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_blue_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
    ]))
    story.append(t_stakeholders)
    story.append(Spacer(1, 8))

    # Phased Roadmap Timeline
    story.append(Paragraph("<b>Six-Month Phased Rollout Schedule:</b>", body_bold))
    roadmap_data = [
        [
            Paragraph("<b>Phase</b>", table_header_style),
            Paragraph("<b>Timeline</b>", table_header_style),
            Paragraph("<b>Milestones &amp; Deliverables</b>", table_header_style)
        ],
        [
            Paragraph("<b>Phase I: Setup &amp; Baseline</b>", table_cell_bold),
            Paragraph("Month 1", table_cell_style),
            Paragraph("Deploy Next.js 16 PWA on Vercel; configure Supabase database RLS schemas; calibrate Gemini Flash Lite cascade; map USTP campus drainage outfall coordinates.", table_cell_style)
        ],
        [
            Paragraph("<b>Phase II: Campus Alpha</b>", table_cell_bold),
            Paragraph("Month 2", table_cell_style),
            Paragraph("Onboard 50 USTP student-leaders and 10 PPO maintenance staff; conduct controlled trials of photo reporting, scale weighing, and triage dispatching.", table_cell_style)
        ],
        [
            Paragraph("<b>Phase III: MRF Integration</b>", table_cell_bold),
            Paragraph("Month 3", table_cell_style),
            Paragraph("Onboard 2 partner junk shops in Lapasan; establish digital custody transfer sign-offs; calibrate digital hanging crane scales for collection crews.", table_cell_style)
        ],
        [
            Paragraph("<b>Phase IV: Monsoon Beta</b>", table_cell_bold),
            Paragraph("Months 4â€“5", table_cell_style),
            Paragraph("Execute live field trials during high-precipitation monsoon events; monitor CM Recto artery; validate mass-balance telemetry under heavy load (>500 reports/week).", table_cell_style)
        ],
        [
            Paragraph("<b>Phase V: Audit &amp; Policy</b>", table_cell_bold),
            Paragraph("Month 6", table_cell_style),
            Paragraph("Publish comprehensive mass-balance audit; deliver pilot policy memorandum to CDO City Council and DOST; package open API specifications.", table_cell_style)
        ]
    ]
    t_roadmap = Table(roadmap_data, colWidths=[content_width*0.25, content_width*0.15, content_width*0.60], repeatRows=1)
    t_roadmap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_blue_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
    ]))
    story.append(t_roadmap)
    story.append(Spacer(1, 8))

    # ==========================================
    # 8. LEGISLATIVE & POLICY ALIGNMENT
    # ==========================================
    story.extend(make_h1("8. Philippine Policy &amp; Statutory Alignment"))
    
    p_legal = (
        "A compelling concept paper must substantiate compliance with prevailing Philippine environmental and disaster management mandates. "
        "SubAI directly addresses the operational mandates of four major statutory frameworks:"
    )
    story.append(Paragraph(p_legal, body_style))

    story.append(Paragraph("<b>1. Republic Act 9003 (Ecological Solid Waste Management Act of 2000):</b><br/>"
                           "Mandates segregation at source and minimum 25% waste diversion from disposal facilities. SubAI provides LGUs "
                           "and universities with verifiable, kilogram-calibrated digital records of diverted materials, directly supporting barangay MRF audits.", bullet_style))
    story.append(Paragraph("<b>2. Republic Act 11898 (Extended Producer Responsibility Act of 2022 - EPR Law):</b><br/>"
                           "Obliges large enterprise product manufacturers to account for plastic packaging recovery. SubAI's immutable custody transfer receipts "
                           "and PET/film segregation records serve as uncompromised third-party verification for corporate EPR compliance credits.", bullet_style))
    story.append(Paragraph("<b>3. Republic Act 10121 (Philippine DRRM Act of 2010):</b><br/>"
                           "Prioritizes proactive disaster risk reduction over reactive disaster response. By identifying and clearing drainage chokepoints "
                           "<i>before</i> monsoon downpours peak, SubAI operationalizes institutional pre-disaster flood mitigation.", bullet_style))
    story.append(Paragraph("<b>4. CDO City Ordinance No. 13378-2018 (Integrated Solid Waste Management Ordinance):</b><br/>"
                           "Prohibits the dumping of refuse into waterways and open drainage canals. The platform equips city inspectors and community brigades "
                           "with geotagged photographic evidence to enforce municipal sanitation standards.", bullet_style))
    story.append(Spacer(1, 8))

    # ==========================================
    # 9. EXPECTED IMPACTS & KEY PERFORMANCE INDICATORS (KPIS)
    # ==========================================
    story.extend(make_h1("9. Anticipated Impacts &amp; Target Key Performance Indicators"))
    
    p_impact = (
        "Concept papers submitted to academic bodies, DOST, or international granting entities require rigorous, quantifiable KPIs. "
        "The following performance matrix defines the benchmark evaluation criteria for the SubAI pilot deployment:"
    )
    story.append(Paragraph(p_impact, body_style))

    kpi_data = [
        [
            Paragraph("<b>Impact Dimension</b>", table_header_style),
            Paragraph("<b>Target Metric / Indicator</b>", table_header_style),
            Paragraph("<b>Baseline (Conventional)</b>", table_header_style),
            Paragraph("<b>Projected Pilot Target</b>", table_header_style)
        ],
        [
            Paragraph("<b>Disaster Resilience</b>", table_cell_bold),
            Paragraph("Drainage obstruction clearance SLA (Report to Verified Cleared)", table_cell_style),
            Paragraph("7 to 21 days (or unaddressed)", table_cell_style),
            Paragraph("<b>&lt;= 24 hours</b> for High Priority (P&gt;=4); <b>&lt;= 72 hours</b> for Medium Priority.", table_cell_style)
        ],
        [
            Paragraph("<b>Flood Hazard Reduction</b>", table_cell_bold),
            Paragraph("Drainage hydraulic cross-section availability along Bitan-ag", table_cell_style),
            Paragraph("40%â€“60% choked by silt and plastic", table_cell_style),
            Paragraph("<b>&gt;= 85% clear cross-section</b> maintained across targeted pilot corridor.", table_cell_style)
        ],
        [
            Paragraph("<b>Circular Recovery</b>", table_cell_bold),
            Paragraph("Diverted plastic mass recovered from drainage corridors", table_cell_style),
            Paragraph("0% (100% dumped or washed to sea)", table_cell_style),
            Paragraph("<b>&gt;= 3,500 kg</b> of PET and rigid plastics diverted to MRFs over 6-month pilot.", table_cell_style)
        ],
        [
            Paragraph("<b>Mass-Balance Integrity</b>", table_cell_bold),
            Paragraph("Audit discrepancy between collection and disposition", table_cell_style),
            Paragraph("Unmeasured / complete black hole", table_cell_style),
            Paragraph("<b>&lt; 2.0% discrepancy</b> between scale weights and custody transfers.", table_cell_style)
        ],
        [
            Paragraph("<b>Community Mobilization</b>", table_cell_bold),
            Paragraph("Active civic/student reporters and validated submissions", table_cell_style),
            Paragraph("Passive / reactive Facebook rants", table_cell_style),
            Paragraph("<b>&gt;= 250 active reporters</b>; <b>&gt;= 1,000 verified photographic reports</b> logged.", table_cell_style)
        ],
        [
            Paragraph("<b>Stormwater Buffering</b>", table_cell_bold),
            Paragraph("Rain Bank rooftop runoff modeled and retained", table_cell_style),
            Paragraph("0 liters retained (100% flash runoff)", table_cell_style),
            Paragraph("<b>&gt;= 150,000 liters</b> of localized rainwater retention capacity modeled.", table_cell_style)
        ]
    ]
    t_kpi = Table(kpi_data, colWidths=[content_width*0.22, content_width*0.30, content_width*0.24, content_width*0.24], repeatRows=1)
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_blue_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
    ]))
    story.append(t_kpi)
    story.append(Spacer(1, 8))

    # ==========================================
    # 10. ACRONYMS & TECHNICAL GLOSSARY
    # ==========================================
    story.extend(make_h1("10. Directory of Acronyms &amp; Technical Glossary"))
    
    glossary_data = [
        [Paragraph("<b>Acronym / Term</b>", table_header_style), Paragraph("<b>Definition &amp; Context in SubAI</b>", table_header_style)],
        [Paragraph("<b>CDO</b>", table_cell_bold), Paragraph("Cagayan de Oro City, Northern Mindanao, Philippines (Target deployment municipality).", table_cell_style)],
        [Paragraph("<b>CEIW 2026</b>", table_cell_bold), Paragraph("Circular Economy &amp; Green Innovation Pitching Competition / Challenge program.", table_cell_style)],
        [Paragraph("<b>CLENRO</b>", table_cell_bold), Paragraph("City Local Environment and Natural Resources Office (CDO's municipal solid waste authority).", table_cell_style)],
        [Paragraph("<b>CDRRMD</b>", table_cell_bold), Paragraph("City Disaster Risk Reduction and Management Department of Cagayan de Oro.", table_cell_style)],
        [Paragraph("<b>USTP</b>", table_cell_bold), Paragraph("University of Science and Technology of Southern Philippines (CDO Campus).", table_cell_style)],
        [Paragraph("<b>MRF</b>", table_cell_bold), Paragraph("Materials Recovery Facility (Facility for segregating, baling, and processing recyclables).", table_cell_style)],
        [Paragraph("<b>PWA</b>", table_cell_bold), Paragraph("Progressive Web App (App that works seamlessly across iOS/Android browsers without app store gatekeeping).", table_cell_style)],
        [Paragraph("<b>RLS</b>", table_cell_bold), Paragraph("Row Level Security (PostgreSQL security mechanism enforcing row-by-row actor permissions).", table_cell_style)],
        [Paragraph("<b>EPR</b>", table_cell_bold), Paragraph("Extended Producer Responsibility (RA 11898 obliging brand owners to recover plastic packaging).", table_cell_style)],
        [Paragraph("<b>DRRM</b>", table_cell_bold), Paragraph("Disaster Risk Reduction and Management (RA 10121 framework for climate-resilient cities).", table_cell_style)],
        [Paragraph("<b>GIS</b>", table_cell_bold), Paragraph("Geographic Information System (Spatial mapping and coordinate visualization via Leaflet / OSM).", table_cell_style)],
        [Paragraph("<b>Bitan-ag Creek</b>", table_cell_bold), Paragraph("The primary 7-kilometer urban drainage tributary running through the center of Cagayan de Oro.", table_cell_style)],
        [Paragraph("<b>Rain Bank</b>", table_cell_bold), Paragraph("Integrated stormwater retention calculator modeling non-potable rainwater harvesting to abate flash runoff.", table_cell_style)]
    ]
    t_glossary = Table(glossary_data, colWidths=[content_width*0.25, content_width*0.75], repeatRows=1)
    t_glossary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_blue_dark),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_light]),
    ]))
    story.append(t_glossary)
    story.append(Spacer(1, 8))

    # Concluding Callout
    summary_box = (
        "<b>Summary Note for Proposal Authors:</b><br/>"
        "This briefing provides the complete systemic architecture for authoring academic concept papers, grant proposals, "
        "and LGU memoranda of agreement. The software implementation is fully developed, operational, and verified in codebase "
        "repository <code>JRSstuff/SubAI</code>. All features referencedâ€”including client-side canvas downscaling, Gemini Flash Lite "
        "vision categorization, reverse geocoding, 1.0xâ€“3.5x image zoom triage inspection, scale weighing inputs, and mass-balance accountingâ€”are "
        "fully functional production modules ready for field demonstration."
    )
    story.append(make_callout(summary_box, bg_color=c_callout_bg, border_color=c_blue))

    # Build PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Successfully generated {filename}")

if __name__ == "__main__":
    out_pdf = "SubAI_CDO_Concept_Paper_Briefing.pdf"
    if len(sys.argv) > 1:
        out_pdf = sys.argv[1]
    build_pdf(out_pdf)

