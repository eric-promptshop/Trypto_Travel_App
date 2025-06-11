#\!/bin/bash

# Archive unused UI components
echo "Archiving unused UI components..."
mv components/ui/accordion.tsx .archive/components/ui/ 2>/dev/null || echo "accordion.tsx already moved"
mv components/ui/alert-dialog.tsx .archive/components/ui/ 2>/dev/null || echo "alert-dialog.tsx already moved"
mv components/ui/aspect-ratio.tsx .archive/components/ui/ 2>/dev/null || echo "aspect-ratio.tsx already moved"
mv components/ui/breadcrumb.tsx .archive/components/ui/ 2>/dev/null || echo "breadcrumb.tsx already moved"
mv components/ui/carousel.tsx .archive/components/ui/ 2>/dev/null || echo "carousel.tsx already moved"
mv components/ui/context-menu.tsx .archive/components/ui/ 2>/dev/null || echo "context-menu.tsx already moved"
mv components/ui/drawer.tsx .archive/components/ui/ 2>/dev/null || echo "drawer.tsx already moved"
mv components/ui/hover-card.tsx .archive/components/ui/ 2>/dev/null || echo "hover-card.tsx already moved"
mv components/ui/input-otp.tsx .archive/components/ui/ 2>/dev/null || echo "input-otp.tsx already moved"
mv components/ui/menubar.tsx .archive/components/ui/ 2>/dev/null || echo "menubar.tsx already moved"
mv components/ui/navigation-menu.tsx .archive/components/ui/ 2>/dev/null || echo "navigation-menu.tsx already moved"
mv components/ui/pagination.tsx .archive/components/ui/ 2>/dev/null || echo "pagination.tsx already moved"
mv components/ui/resizable.tsx .archive/components/ui/ 2>/dev/null || echo "resizable.tsx already moved"
mv components/ui/skip-link.tsx .archive/components/ui/ 2>/dev/null || echo "skip-link.tsx already moved"
mv components/ui/toaster.tsx .archive/components/ui/ 2>/dev/null || echo "toaster.tsx already moved"
mv components/ui/toggle-group.tsx .archive/components/ui/ 2>/dev/null || echo "toggle-group.tsx already moved"

# Archive unused admin components
echo "Archiving unused admin components..."
mv components/admin/ContentManagement.tsx .archive/components/admin/ 2>/dev/null || echo "ContentManagement.tsx already moved"
mv components/admin/RoleManagement.tsx .archive/components/admin/ 2>/dev/null || echo "RoleManagement.tsx already moved"

# Archive demo components
echo "Archiving demo components..."
mv components/flight-display/flight-display-demo.tsx .archive/components/flight-display/ 2>/dev/null || echo "flight-display-demo.tsx already moved"
mv components/hotel-display/hotel-display-demo.tsx .archive/components/hotel-display/ 2>/dev/null || echo "hotel-display-demo.tsx already moved"

# Archive other unused components
echo "Archiving other unused components..."
mv components/dashboard/TravelDashboard.tsx .archive/components/dashboard/ 2>/dev/null || echo "TravelDashboard.tsx already moved"
mv components/sidebar.tsx .archive/components/ 2>/dev/null || echo "sidebar.tsx already moved"
mv components/ui/sidebar.tsx .archive/components/ui/ 2>/dev/null || echo "ui/sidebar.tsx already moved"
mv components/landing-page.tsx .archive/components/ 2>/dev/null || echo "landing-page.tsx already moved"
mv components/main-content.tsx .archive/components/ 2>/dev/null || echo "main-content.tsx already moved"
mv components/setup-instructions.tsx .archive/components/ 2>/dev/null || echo "setup-instructions.tsx already moved"
mv components/toggle-test.tsx .archive/components/ 2>/dev/null || echo "toggle-test.tsx already moved"
mv components/BatterySettings.tsx .archive/components/ 2>/dev/null || echo "BatterySettings.tsx already moved"
mv components/images/optimized-image.tsx .archive/components/images/ 2>/dev/null || echo "optimized-image.tsx already moved"
mv components/itinerary-builder.tsx .archive/components/ 2>/dev/null || echo "itinerary-builder.tsx already moved"
mv components/onboarding/WhiteLabelOnboarding.tsx .archive/components/onboarding/ 2>/dev/null || echo "WhiteLabelOnboarding.tsx already moved"
mv components/performance/lazy-component.tsx .archive/components/performance/ 2>/dev/null || echo "lazy-component.tsx already moved"
mv components/templates/TemplateEditor.tsx .archive/components/templates/ 2>/dev/null || echo "TemplateEditor.tsx already moved"

echo "✅ Component archival complete\!"
