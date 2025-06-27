"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { useOnboarding } from "@/contexts/onboarding-context"
import { ChevronLeft, ChevronRight, PlusCircle, AlertCircle, Trash2 } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

interface PricingRow {
  id: string
  destination: string
  star3: string
  star4: string
  star5: string
}

const initialPricingMatrix: PricingRow[] = [
  { id: uuidv4(), destination: "Peru", star3: "150", star4: "250", star5: "400" },
  { id: uuidv4(), destination: "Brazil", star3: "180", star4: "280", star5: "450" },
]

export function PricingConfigurationScreen() {
  const { onboardingData, updateOnboardingData, navigateToNextStep, navigateToPrevStep } = useOnboarding()

  // Extract unique destinations from imported tours
  const getUniqueDestinations = () => {
    if (!onboardingData.contentImport?.tours || onboardingData.contentImport.tours.length === 0) {
      return [];
    }
    
    // Get unique destinations from imported tours
    const destinations = new Set<string>();
    onboardingData.contentImport.tours.forEach(tour => {
      // Parse destination - it might have multiple locations separated by commas
      const tourDestinations = tour.destination.split(',').map(d => d.trim());
      tourDestinations.forEach(dest => {
        if (dest) destinations.add(dest);
      });
    });
    
    return Array.from(destinations).sort();
  };

  const uniqueDestinations = getUniqueDestinations();
  
  // Create initial pricing matrix from imported destinations or use defaults
  const createInitialMatrix = (): PricingRow[] => {
    if (onboardingData.pricingConfig?.matrix && onboardingData.pricingConfig.matrix.length > 0) {
      return onboardingData.pricingConfig.matrix;
    }
    
    if (uniqueDestinations.length > 0) {
      // Create pricing rows for each unique destination
      return uniqueDestinations.map(destination => ({
        id: uuidv4(),
        destination,
        star3: "150", // Default pricing
        star4: "250",
        star5: "400"
      }));
    }
    
    // Fall back to initial defaults if no imported tours
    return initialPricingMatrix;
  };

  const [pricingMatrix, setPricingMatrix] = useState<PricingRow[]>(createInitialMatrix())
  const [includeMargin, setIncludeMargin] = useState(onboardingData.pricingConfig?.includeMargin ?? true)
  const [displayRanges, setDisplayRanges] = useState(onboardingData.pricingConfig?.displayRanges ?? true)
  
  // Update pricing matrix when imported tours change
  useEffect(() => {
    if (!onboardingData.pricingConfig?.matrix && uniqueDestinations.length > 0) {
      const newMatrix = uniqueDestinations.map(destination => ({
        id: uuidv4(),
        destination,
        star3: "150",
        star4: "250",
        star5: "400"
      }));
      setPricingMatrix(newMatrix);
    }
  }, [uniqueDestinations.length]) // Only depend on the length to avoid infinite loops

  const handleMatrixChange = (id: string, field: keyof PricingRow, value: string) => {
    setPricingMatrix((prevMatrix) => prevMatrix.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  const addDestinationRow = () => {
    setPricingMatrix((prevMatrix) => [
      ...prevMatrix,
      { id: uuidv4(), destination: "", star3: "", star4: "", star5: "" },
    ])
  }

  const removeDestinationRow = (id: string) => {
    setPricingMatrix((prevMatrix) => prevMatrix.filter((row) => row.id !== id))
  }

  const handleContinue = () => {
    // Basic validation: ensure no empty destination or price fields for non-empty rows
    const isValid = pricingMatrix.every(
      (row) =>
        row.destination &&
        row.star3 &&
        !isNaN(Number.parseFloat(row.star3)) &&
        row.star4 &&
        !isNaN(Number.parseFloat(row.star4)) &&
        row.star5 &&
        !isNaN(Number.parseFloat(row.star5)),
    )

    if (!isValid) {
      alert("Please ensure all destinations have valid pricing for all star levels.")
      return
    }

    updateOnboardingData({
      pricingConfig: {
        matrix: pricingMatrix,
        includeMargin,
        displayRanges,
      },
    })
    navigateToNextStep()
  }

  const applyPercentageIncrease = (percentage: number) => {
    setPricingMatrix((prevMatrix) =>
      prevMatrix.map((row) => ({
        ...row,
        star3: (Number.parseFloat(row.star3) * (1 + percentage / 100)).toFixed(0),
        star4: (Number.parseFloat(row.star4) * (1 + percentage / 100)).toFixed(0),
        star5: (Number.parseFloat(row.star5) * (1 + percentage / 100)).toFixed(0),
      })),
    )
  }

  return (
    <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-primary-blue mb-6">Pricing Configuration</h2>

      <Card className="mb-6 bg-blue-50 border-primary-blue/30">
        <CardContent className="p-4">
          <p className="text-sm text-primary-blue">
            Set your per-person, per-day pricing (USD) for different accommodation levels. These will be used to
            generate initial estimates for your customers.
          </p>
          {uniqueDestinations.length > 0 && !onboardingData.pricingConfig?.matrix && (
            <p className="text-sm text-primary-blue mt-2 font-medium">
              ✓ Destinations have been automatically populated from your imported tours.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="overflow-x-auto mb-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Destination</TableHead>
              <TableHead>3-Star (USD)</TableHead>
              <TableHead>4-Star (USD)</TableHead>
              <TableHead>5-Star (USD)</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricingMatrix.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Input
                    value={row.destination}
                    onChange={(e) => handleMatrixChange(row.id, "destination", e.target.value)}
                    placeholder="e.g., Cusco"
                    className="h-9"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.star3}
                    onChange={(e) => handleMatrixChange(row.id, "star3", e.target.value)}
                    placeholder="e.g., 150"
                    className="h-9 w-24"
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.star4}
                    onChange={(e) => handleMatrixChange(row.id, "star4", e.target.value)}
                    placeholder="e.g., 250"
                    className="h-9 w-24"
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={row.star5}
                    onChange={(e) => handleMatrixChange(row.id, "star5", e.target.value)}
                    placeholder="e.g., 400"
                    className="h-9 w-24"
                    min="0"
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeDestinationRow(row.id)}
                    className="text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button variant="outline" onClick={addDestinationRow} className="mb-8 text-primary-blue border-primary-blue/50">
        <PlusCircle className="w-4 h-4 mr-2" /> Add Destination
      </Button>

      <section className="mb-8">
        <h3 className="text-lg font-medium text-primary-blue mb-4">Additional Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-md bg-slate-50/50">
            <Label htmlFor="includeMargin" className="text-sm text-slate-700">
              Include 15% operational margin in estimates
            </Label>
            <Switch id="includeMargin" checked={includeMargin} onCheckedChange={setIncludeMargin} />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-md bg-slate-50/50">
            <Label htmlFor="displayRanges" className="text-sm text-slate-700">
              Display as price ranges instead of fixed prices
            </Label>
            <Switch id="displayRanges" checked={displayRanges} onCheckedChange={setDisplayRanges} />
          </div>
        </div>
        <Card className="mt-4 bg-amber-50 border-amber-400/50">
          <CardContent className="p-3">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-amber-600 mr-2 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700">
                <strong>Tip:</strong> These are estimates only. Final quotes are still customized by your team. Price
                ranges can help manage customer expectations.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <h3 className="text-lg font-medium text-primary-blue mb-4">Bulk Actions</h3>
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => applyPercentageIncrease(10)}
            className="border-primary-blue/50 text-primary-blue"
          >
            Apply 10% Increase to All
          </Button>
          <Button variant="outline" disabled className="border-slate-300 text-slate-500 cursor-not-allowed">
            Copy from Template (Coming Soon)
          </Button>
        </div>
      </section>

      <div className="flex justify-between mt-10">
        <Button variant="ghost" onClick={navigateToPrevStep} className="text-primary-blue hover:bg-blue-50">
          <ChevronLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button
          onClick={handleContinue}
          className="bg-accent-orange hover:bg-orange-600 text-white"
          style={{ backgroundColor: "#ff6b35" }}
        >
          Continue <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
