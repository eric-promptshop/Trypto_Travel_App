# Tour Operator Onboarding - Component Mapping

## Visual Component Mapping

### Screen 1: Welcome (/onboarding/welcome)

**Required Elements → Current Implementation**

```
┌─────────────────────────────────────────────────┐
│ Progress Bar (Step 1 of 7)                      │ → OnboardingProgressBar.tsx
├─────────────────────────────────────────────────┤
│                                                 │
│   "Transform Your Request Forms..."             │ → <h1 className="text-4xl font-bold">
│   "Set up your AI-powered..."                  │ → <p className="text-xl text-gray-600">
│                                                 │
│   ┌─────────┐ ┌─────────┐ ┌─────────┐         │
│   │ ✨ Turn │ │ 📧 Email│ │ 🗺️ Map │         │ → <Card> components with
│   │  leads  │ │ ping-   │ │ visual- │         │   <CardHeader> icons
│   │  into   │ │ pong    │ │ ization │         │   <CardContent> text
│   └─────────┘ └─────────┘ └─────────┘         │
│                                                 │
│        [  Start Setup  ]                        │ → <Button className="bg-[#ff6b35]">
│    ✓ No credit card ✓ 30-day trial            │ → <p className="text-sm text-gray-500">
└─────────────────────────────────────────────────┘
```

### Screen 2: Company Profile (/onboarding/company-profile)

```
┌─────────────────────────────────────────────────┐
│ Company Information                             │
├─────────────────────────────────────────────────┤
│ Company Name*                                   │ → <Input /> with <Label>
│ [Adventure Tours Inc.    ]                      │   form validation
│                                                 │
│ Website URL*                                    │ → <Input /> with URL validation
│ [https://____________    ]                      │
│                                                 │
│ Destinations (Multi-select)                     │ → Custom checkbox group
│ ☑ Peru  ☑ Brazil  ☐ Chile                     │   with state management
│                                                 │
│ Company Type                                    │ → <RadioGroup> with
│ ⦿ Custom/Private Tours                         │   styled <Card> wrappers
│ ○ Group Departures                              │
│                                                 │
│ [Back] [Continue]                               │ → Navigation buttons
└─────────────────────────────────────────────────┘
```

### Screen 3: Content Import (/onboarding/import)

```
┌─────────────────────────────────────────────────┐
│          Choose Import Method                   │
├─────────────────────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
│ │ 🔍 Website  │ │ 📄 Upload   │ │ ✏️ Manual   ││ → Clickable <Card>s
│ │    Scan     │ │ Documents   │ │   Entry     ││   with hover effects
│ │[RECOMMENDED]│ │             │ │[Coming Soon]││
│ └─────────────┘ └─────────────┘ └─────────────┘│
│                                                 │
│ When scanning:                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ ⟳ Scanning your website...                  ││ → Loading animation
│ │ Found 23 tours so far                       ││   Progress counter
│ └─────────────────────────────────────────────┘│
│                                                 │
│ Results Table:                                  │ → <Table> with search
│ ┌─────┬──────────┬─────────┬────────┬────────┐│   and toggle switches
│ │ ☑  │Tour Name │Dest.    │Duration│Status  ││
│ └─────┴──────────┴─────────┴────────┴────────┘│
└─────────────────────────────────────────────────┘
```

### Screen 4: Pricing Configuration (/onboarding/pricing)

```
┌─────────────────────────────────────────────────┐
│         Set Your Pricing Structure              │
├─────────────────────────────────────────────────┤
│ ┌─────────────┬────────┬────────┬────────────┐│
│ │Destination  │3-Star  │4-Star  │5-Star      ││ → Editable <Table>
│ ├─────────────┼────────┼────────┼────────────┤│   with <Input> cells
│ │Peru         │[$150]  │[$200]  │[$300]      ││
│ │Brazil       │[$180]  │[$250]  │[$400]      ││
│ └─────────────┴────────┴────────┴────────────┘│
│                                                 │
│ ☑ Include 15% operational margin               │ → <Switch> components
│ ☑ Display as price ranges                      │
│                                                 │
│ 💡 Tip: These are estimates only               │ → Alert component
└─────────────────────────────────────────────────┘
```

### Screen 5: Branding Customization (/onboarding/branding)

```
┌─────────────────────────────────────────────────┐
│   Customize         │      Live Preview         │
├────────────────────┼───────────────────────────┤
│ Logo Upload:       │   ┌─────────────────────┐ │
│ ┌─────────────┐    │   │ [Logo] Your Trip    │ │ → Split layout with
│ │ Drop file   │    │   │                     │ │   real-time preview
│ │   here      │    │   │  Destination: Peru  │ │
│ └─────────────┘    │   │  Duration: 7 days   │ │
│                    │   │                     │ │
│ Primary Color:     │   │  [Generate Trip]    │ │
│ [#1f5582 ⬤]       │   └─────────────────────┘ │ → Color picker
│                    │                           │   updates preview
│ Font: [Inter ▼]    │                           │
└────────────────────┴───────────────────────────┘
```

### Screen 6: CRM Integration (/onboarding/integrations)

```
┌─────────────────────────────────────────────────┐
│        Connect Your CRM System                  │
├─────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ HubSpot  │ │Salesforce│ │   Zoho   │        │ → Integration cards
│ │ [logo]   │ │  [logo]  │ │  [logo]  │        │   with logos
│ │[Connect] │ │[Connect] │ │[Connect] │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│ When connected:                                 │
│ ┌─────────────────────────────────────────────┐│
│ │ API Key: [****************]                 ││ → Configuration panel
│ │ Pipeline: [Sales Pipeline ▼]                ││   with dropdowns
│ │ Assignee: [John Smith ▼]                    ││
│ │ [Test Connection] ✓ Connected               ││ → Success state
│ └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

### Screen 7: Review & Launch (/onboarding/review)

```
┌─────────────────────────────────────────────────┐
│          Ready to Launch!                       │
├─────────────────────────────────────────────────┤
│ ✓ Company: Adventure Tours Inc                 │ → Summary cards
│ ✓ Content: 47 tours imported                   │   with checkmarks
│ ✓ Pricing: All destinations configured         │
│ ✓ Branding: Custom theme applied               │
│ ✓ CRM: Connected to HubSpot                    │
│                                                 │
│         🚀                                      │ → Celebration graphic
│                                                 │
│ ☐ I've reviewed everything                     │ → Checkbox confirmation
│                                                 │
│ [Preview Trip Builder] [Activate Trip Builder]  │ → Action buttons
└─────────────────────────────────────────────────┘
```

## Component Library Usage

### UI Components from shadcn/ui

- **Card**: Used for all content containers
- **Button**: Primary (#ff6b35), secondary, ghost variants
- **Input**: Form fields with validation
- **Label**: Consistent labeling
- **Select**: Dropdowns throughout
- **Table**: Pricing matrix, content list
- **Switch**: Toggle settings
- **RadioGroup**: Company type selection
- **Checkbox**: Multi-select options
- **Progress**: Progress bar
- **Alert**: Tips and notifications
- **Dialog**: Preview modals
- **Badge**: "Recommended" labels

### Custom Components

- **OnboardingProgressBar**: Step indicator
- **ColorPicker**: Brand color selection
- **FileUpload**: Logo/document upload
- **PricingMatrix**: Editable pricing table
- **LivePreview**: Real-time theme preview
- **CRMConnector**: Integration panels

### State Management

```typescript
// OnboardingContext provides:
- currentStep tracking
- form data persistence
- navigation methods
- validation state
- API integration hooks
```

### Responsive Behavior

```css
/* Mobile (< 768px) */
- Cards stack vertically
- Navigation simplified
- Touch-optimized inputs

/* Tablet (768px - 1024px) */
- 2-column layouts where applicable
- Maintained readability

/* Desktop (> 1024px) */
- Full layouts as shown
- Split-screen previews
- Multi-column cards
```

## Backend Service Mapping

| Frontend Action | Backend Service | API Endpoint |
|----------------|-----------------|--------------|
| Save company profile | Tenant creation | POST /api/admin/clients |
| Scan website | Content scraping | POST /api/content/scan |
| Upload files | File processing | POST /api/content/upload |
| Save pricing | Tenant settings | PUT /api/admin/clients/[id] |
| Apply branding | Theme management | POST /api/admin/themes |
| Connect CRM | CRM service | POST /api/crm/connect |
| Deploy platform | Deployment service | POST /api/admin/deploy |

## Conclusion

All required UI components and backend services are already implemented in the codebase. The onboarding flow can be fully achieved with the current infrastructure.