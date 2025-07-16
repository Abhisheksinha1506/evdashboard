import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { HelpCircle, Info, Calculator } from 'lucide-react';

interface Factors {
  temperature: number;
  speed: number;
  climate: number;
  terrain: number;
}

type ClimateUsage = 'Low' | 'Medium' | 'High';
type TerrainType = 'Flat' | 'Hilly' | 'Mountain';

const NumericInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & { onChange: (value: number) => void }
>(({ className, value, onChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsedValue = parseFloat(e.target.value);
    if (!isNaN(parsedValue)) {
      onChange(parsedValue);
    } else if (e.target.value === "") {
      onChange(0);
    }
  };

  return (
    <Input
      type="number"
      className={className}
      value={isNaN(value as number) ? '' : (value as number)}
      onChange={handleChange}
      ref={ref}
      {...props}
    />
  );
});
NumericInput.displayName = "NumericInput";

export default function Index() {
  const [batteryCapacity, setBatteryCapacity] = useState<number>(75);
  const [epaRange, setEpaRange] = useState<number>(330);
  const [currentCharge, setCurrentCharge] = useState<number>(80);
  const [temperature, setTemperature] = useState<number>(70);
  const [avgSpeed, setAvgSpeed] = useState<number>(65);
  const [climateUsage, setClimateUsage] = useState<ClimateUsage>('Medium');
  const [terrainType, setTerrainType] = useState<TerrainType>('Flat');
  const [estimatedRange, setEstimatedRange] = useState<number>(0);
  const [efficiency, setEfficiency] = useState<number>(0);
  const [factors, setFactors] = useState<Factors>({
    temperature: 1,
    speed: 1,
    climate: 1,
    terrain: 1,
  });
  const [showFormulas, setShowFormulas] = useState<boolean>(false);

  useEffect(() => {
    // Temperature impact
    const temperatureFactor = 1 - (Math.abs(temperature - 70) * 0.015);

    // Speed impact (assuming optimal speed is 25 mph)
    const speedFactor = 1 - (Math.pow(Math.max(0, avgSpeed - 25), 2) * 0.0008);

    // Climate control usage impact
    let climateFactor = 1;
    switch (climateUsage) {
      case 'Low':
        climateFactor = 0.95;
        break;
      case 'Medium':
        climateFactor = 0.85;
        break;
      case 'High':
        climateFactor = 0.75;
        break;
    }

    // Terrain type impact
    let terrainFactor = 1;
    switch (terrainType) {
      case 'Hilly':
        terrainFactor = 0.9;
        break;
      case 'Mountain':
        terrainFactor = 0.8;
        break;
      default:
        terrainFactor = 1;
        break;
    }

    setFactors({
      temperature: temperatureFactor,
      speed: speedFactor,
      climate: climateFactor,
      terrain: terrainFactor,
    });

    const newEstimatedRange = epaRange * (currentCharge / 100) * temperatureFactor * speedFactor * climateFactor * terrainFactor;
    setEstimatedRange(newEstimatedRange);

    const newEfficiency = batteryCapacity ? newEstimatedRange / (batteryCapacity * (currentCharge / 100)) : 0;
    setEfficiency(newEfficiency);

  }, [batteryCapacity, epaRange, currentCharge, temperature, avgSpeed, climateUsage, terrainType]);

  return (
    <div className="min-h-screen bg-background p-4 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3">
            EV Range Compass
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Calculate your electric vehicle's range based on real-world conditions and driving patterns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">Vehicle Information</h2>
            
            <div className="space-y-6">
              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Label htmlFor="batteryCapacity" className="text-base font-medium text-foreground cursor-help flex items-center gap-1">
                      Battery Capacity (kWh)
                      <HelpCircle className="w-4 h-4" />
                    </Label>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">The total energy storage capacity of your EV's battery pack, typically found in your vehicle specifications.</p>
                  </HoverCardContent>
                </HoverCard>
                <NumericInput
                  id="batteryCapacity"
                  value={batteryCapacity}
                  onChange={(value) => setBatteryCapacity(value)}
                  min={10}
                  max={200}
                  step={1}
                  className="mt-2 text-base"
                />
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Label htmlFor="epaRange" className="text-base font-medium text-foreground cursor-help flex items-center gap-1">
                      EPA Range (miles)
                      <HelpCircle className="w-4 h-4" />
                    </Label>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">The official EPA-rated range of your vehicle under standardized testing conditions.</p>
                  </HoverCardContent>
                </HoverCard>
                <NumericInput
                  id="epaRange"
                  value={epaRange}
                  onChange={(value) => setEpaRange(value)}
                  min={50}
                  max={500}
                  step={1}
                  className="mt-2 text-base"
                />
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Label htmlFor="currentCharge" className="text-base font-medium text-foreground cursor-help flex items-center gap-1">
                      Current Charge (%)
                      <HelpCircle className="w-4 h-4" />
                    </Label>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Your vehicle's current battery charge level as a percentage of total capacity.</p>
                  </HoverCardContent>
                </HoverCard>
                <div className="mt-2">
                  <NumericInput
                    id="currentCharge"
                    value={currentCharge}
                    onChange={(value) => setCurrentCharge(value)}
                    min={0}
                    max={100}
                    step={1}
                    className="text-base"
                  />
                  <Progress value={currentCharge} className="mt-3 h-3" />
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold mt-8 mb-4 text-foreground">Driving Conditions</h3>
            
            <div className="space-y-6">
              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Label htmlFor="temperature" className="text-base font-medium text-foreground cursor-help flex items-center gap-1">
                      Temperature (°F)
                      <HelpCircle className="w-4 h-4" />
                    </Label>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Ambient temperature significantly affects battery performance. Extreme cold or heat reduces efficiency.</p>
                  </HoverCardContent>
                </HoverCard>
                <NumericInput
                  id="temperature"
                  value={temperature}
                  onChange={(value) => setTemperature(value)}
                  min={-20}
                  max={120}
                  step={1}
                  className="mt-2 text-base"
                />
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Label htmlFor="avgSpeed" className="text-base font-medium text-foreground cursor-help flex items-center gap-1">
                      Average Speed (mph)
                      <HelpCircle className="w-4 h-4" />
                    </Label>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Higher speeds increase aerodynamic drag and reduce efficiency. City driving (25-35 mph) is typically most efficient.</p>
                  </HoverCardContent>
                </HoverCard>
                <NumericInput
                  id="avgSpeed"
                  value={avgSpeed}
                  onChange={(value) => setAvgSpeed(value)}
                  min={5}
                  max={85}
                  step={1}
                  className="mt-2 text-base"
                />
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Label className="text-base font-medium text-foreground cursor-help flex items-center gap-1">
                      Climate Control Usage
                      <HelpCircle className="w-4 h-4" />
                    </Label>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Heating and cooling systems draw significant power from the battery, especially heating in winter conditions.</p>
                  </HoverCardContent>
                </HoverCard>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(['Low', 'Medium', 'High'] as ClimateUsage[]).map((level) => (
                    <Button
                      key={level}
                      variant={climateUsage === level ? "default" : "outline"}
                      onClick={() => setClimateUsage(level)}
                      className="text-sm font-medium"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <Label className="text-base font-medium text-foreground cursor-help flex items-center gap-1">
                      Terrain Type
                      <HelpCircle className="w-4 h-4" />
                    </Label>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Hilly terrain requires more energy for climbing but can recover some through regenerative braking on descents.</p>
                  </HoverCardContent>
                </HoverCard>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  {(['Flat', 'Hilly', 'Mountain'] as TerrainType[]).map((terrain) => (
                    <Button
                      key={terrain}
                      variant={terrainType === terrain ? "default" : "outline"}
                      onClick={() => setTerrainType(terrain)}
                      className="text-sm font-medium"
                    >
                      {terrain}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Results Section */}
          <Card className="p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-semibold text-foreground">Range Analysis</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFormulas(!showFormulas)}
                className="text-sm"
              >
                <Calculator className="w-4 h-4 mr-2" />
                {showFormulas ? 'Hide' : 'Show'} Formulas
              </Button>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground text-center">
                <Info className="w-4 h-4 inline mr-1" />
                These calculations provide rough estimates based on typical EV performance characteristics and may vary from actual results.
              </p>
            </div>

            {showFormulas && (
              <Card className="p-4 mb-6 bg-muted/30">
                <h3 className="text-lg font-semibold mb-3 text-foreground">Calculation Formulas</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-foreground">Temperature Factor:</p>
                    <p className="text-muted-foreground font-mono">factor = 1 - (|temp - 70| × 0.015)</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Speed Factor:</p>
                    <p className="text-muted-foreground font-mono">factor = 1 - ((speed - 25)² × 0.0008)</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Climate Factor:</p>
                    <p className="text-muted-foreground font-mono">Low: 0.95, Medium: 0.85, High: 0.75</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Terrain Factor:</p>
                    <p className="text-muted-foreground font-mono">Flat: 1.0, Hilly: 0.9, Mountain: 0.8</p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Final Range:</p>
                    <p className="text-muted-foreground font-mono">EPA Range × All Factors × (Current Charge / 100)</p>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-6">
              <div className="text-center">
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div className="cursor-help">
                      <div className="text-5xl font-bold text-primary mb-2">
                        {Math.round(estimatedRange)}
                      </div>
                      <div className="text-lg text-muted-foreground">
                        Estimated Range (miles)
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Your estimated driving range based on current conditions and charge level.</p>
                  </HoverCardContent>
                </HoverCard>
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <h3 className="text-lg font-semibold mb-4 text-foreground cursor-help flex items-center gap-1">
                      Core Metrics
                      <HelpCircle className="w-4 h-4" />
                    </h3>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">Key performance indicators for your current driving scenario.</p>
                  </HoverCardContent>
                </HoverCard>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-lg p-4">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="cursor-help">
                          <div className="text-2xl font-bold text-foreground">
                            {Math.round(efficiency * 10) / 10}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Efficiency (mi/kWh)
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">How many miles you can travel per kWh of battery energy under current conditions.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="cursor-help">
                          <div className="text-2xl font-bold text-foreground">
                            {Math.round((estimatedRange / epaRange) * 100)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            vs EPA Rating
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">How your estimated range compares to the EPA-rated range under ideal conditions.</p>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <h3 className="text-lg font-semibold mb-4 text-foreground cursor-help flex items-center gap-1">
                      Consumption Breakdown
                      <HelpCircle className="w-4 h-4" />
                    </h3>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">How different factors are affecting your vehicle's energy consumption.</p>
                  </HoverCardContent>
                </HoverCard>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="text-sm font-medium text-foreground cursor-help">Temperature Impact</span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">How ambient temperature affects battery performance and range.</p>
                      </HoverCardContent>
                    </HoverCard>
                    <span className={`text-sm font-medium ${factors.temperature < 0.9 ? 'text-destructive' : factors.temperature < 0.95 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.round((1 - factors.temperature) * 100)}% reduction
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="text-sm font-medium text-foreground cursor-help">Speed Impact</span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">How your average driving speed affects aerodynamic drag and efficiency.</p>
                      </HoverCardContent>
                    </HoverCard>
                    <span className={`text-sm font-medium ${factors.speed < 0.9 ? 'text-destructive' : factors.speed < 0.95 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.round((1 - factors.speed) * 100)}% reduction
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="text-sm font-medium text-foreground cursor-help">Climate Control</span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">Energy consumed by heating and cooling systems.</p>
                      </HoverCardContent>
                    </HoverCard>
                    <span className={`text-sm font-medium ${factors.climate < 0.9 ? 'text-destructive' : factors.climate < 0.95 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.round((1 - factors.climate) * 100)}% reduction
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <span className="text-sm font-medium text-foreground cursor-help">Terrain</span>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <p className="text-sm">Additional energy required for climbing hills and mountains.</p>
                      </HoverCardContent>
                    </HoverCard>
                    <span className={`text-sm font-medium ${factors.terrain < 0.9 ? 'text-destructive' : factors.terrain < 0.95 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {Math.round((1 - factors.terrain) * 100)}% reduction
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <h3 className="text-lg font-semibold mb-4 text-foreground cursor-help flex items-center gap-1">
                      Range Sensitivity
                      <HelpCircle className="w-4 h-4" />
                    </h3>
                  </HoverCardTrigger>
                  <HoverCardContent className="w-80">
                    <p className="text-sm">How sensitive your range is to changes in different driving conditions.</p>
                  </HoverCardContent>
                </HoverCard>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">10°F colder</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(epaRange * (currentCharge / 100) * factors.speed * factors.climate * factors.terrain * Math.max(0.4, 1 - (Math.abs((temperature - 10) - 70) * 0.015)))} miles
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">+10 mph faster</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(epaRange * (currentCharge / 100) * factors.temperature * factors.climate * factors.terrain * Math.max(0.4, 1 - (Math.pow(Math.max(0, (avgSpeed + 10) - 25), 2) * 0.0008)))} miles
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-foreground">High climate use</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(epaRange * (currentCharge / 100) * factors.temperature * factors.speed * factors.terrain * 0.75)} miles
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
