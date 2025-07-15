import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronUp, Info, Zap, Battery, Gauge, AlertTriangle, Car } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

// Custom numeric input component
const NumericInput = ({ value, onChange, min, max, step = 1, placeholder, className = "", ...props }) => {
  const [internalValue, setInternalValue] = useState(value === null || value === undefined ? '' : String(value));

  useEffect(() => {
    setInternalValue(value === null || value === undefined ? '' : String(value));
  }, [value]);

  const commitValue = () => {
    let val = internalValue;
    if (val === '' || val === '-' || val === '.' || val === '-.') {
      onChange('');
      return;
    }
    let num = Number(val);
    if (min !== undefined && num < min) num = min;
    if (max !== undefined && num > max) num = max;
    onChange(String(num));
  };

  return (
    <Input
      type="number"
      value={internalValue}
      onChange={(e) => setInternalValue(e.target.value)}
      onBlur={commitValue}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commitValue();
          (e.target as HTMLInputElement).blur();
        }
      }}
      onFocus={(e) => (e.target as HTMLInputElement).select()}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};

// Debounce utility
const debounce = (func: (...args: any[]) => void, delay: number) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const Index = () => {
  // Core state
  const [soc, setSoc] = useState('');
  const [batteryCapacity, setBatteryCapacity] = useState('');
  const [drivingConsumption, setDrivingConsumption] = useState('');
  
  // Advanced options state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [temperature, setTemperature] = useState('25');
  const [manufacturer, setManufacturer] = useState('panasonic');
  const [baseEfficiency, setBaseEfficiency] = useState('0.98');
  const [chargingBehavior, setChargingBehavior] = useState('standard');
  const [chargingDegradation, setChargingDegradation] = useState('0.98');
  const [batteryAgeCycles, setBatteryAgeCycles] = useState('100');
  const [batteryAgeYears, setBatteryAgeYears] = useState('2');
  const [drivingStyle, setDrivingStyle] = useState('normal');
  const [terrain, setTerrain] = useState('flat');
  const [terrainFactor, setTerrainFactor] = useState('1.0');
  const [climateControl, setClimateControl] = useState(false);
  const [climateFactor, setClimateFactor] = useState('0.85');
  const [regenBraking, setRegenBraking] = useState(true);
  const [regenFactor, setRegenFactor] = useState('1.05');
  
  // UI state
  const [predictedRange, setPredictedRange] = useState(null);
  const [calculationTriggered, setCalculationTriggered] = useState(false);
  const [isCoreMetricsOpen, setIsCoreMetricsOpen] = useState(true);
  const [isConsumptionOpen, setIsConsumptionOpen] = useState(true);
  const [isSensitivityOpen, setIsSensitivityOpen] = useState(true);

  const getDynamicDefaults = (capacity) => {
    const consumption = capacity > 75 ? 18 : capacity < 40 ? 14 : 16;
    const terrainFactor = capacity > 75 ? 1.05 : 1.0;
    return { consumption, terrainFactor };
  };

  const calculateRange = (
    soc, batteryCapacity, drivingConsumption, temperature, baseEfficiency,
    chargingDegradation, batteryAgeCycles, batteryAgeYears, terrainFactor,
    climateControl, climateFactor, regenBraking, regenFactor
  ) => {
    const cycleDegradation = 0.0001 * batteryAgeCycles + 0.00000002 * batteryAgeCycles ** 2;
    const calendarDegradation = 0.02 * Math.sqrt(batteryAgeYears);
    const degradation = Math.max(0.7, 1 - (cycleDegradation + calendarDegradation));
    const tempFactor = Math.max(0.7, 1.0 - 0.005 * Math.abs(temperature - 25));
    const effectiveClimateFactor = climateControl ? climateFactor : 1.0;
    const effectiveRegenFactor = regenBraking ? regenFactor : 1.0;
    const effectiveCapacity = batteryCapacity * (soc / 100) * degradation * baseEfficiency * 
      chargingDegradation * tempFactor * effectiveClimateFactor * effectiveRegenFactor;
    const energyConsumption = drivingConsumption * terrainFactor;
    const range = (effectiveCapacity / energyConsumption) * 100;
    
    return { 
      range: Math.max(0, range).toFixed(1),
      effectiveCapacity: effectiveCapacity.toFixed(2),
      cycleDegradation: (cycleDegradation * 100).toFixed(2),
      calendarDegradation: (calendarDegradation * 100).toFixed(2),
      totalDegradation: ((1 - degradation) * 100).toFixed(2),
      tempFactor: tempFactor.toFixed(3),
      energyConsumption: energyConsumption.toFixed(2)
    };
  };

  const validateInputs = () => {
    const requiredFields = showAdvanced
      ? [soc, batteryCapacity, drivingConsumption, temperature, baseEfficiency, chargingDegradation, 
         batteryAgeCycles, batteryAgeYears, terrainFactor, climateFactor, regenFactor]
      : [soc, batteryCapacity, drivingConsumption];
    return requiredFields.every(val => val !== '' && !isNaN(Number(val)));
  };

  const calculateStats = () => {
    const { consumption, terrainFactor: defaultTerrainFactor } = getDynamicDefaults(Number(batteryCapacity));
    const stats = calculateRange(
      Number(soc), Number(batteryCapacity),
      showAdvanced ? Number(drivingConsumption) : consumption,
      showAdvanced ? Number(temperature) : 25,
      showAdvanced ? Number(baseEfficiency) : 0.98,
      showAdvanced ? Number(chargingDegradation) : 0.98,
      showAdvanced ? Number(batteryAgeCycles) : 100,
      showAdvanced ? Number(batteryAgeYears) : 2,
      showAdvanced ? Number(terrainFactor) : defaultTerrainFactor,
      showAdvanced ? climateControl : false,
      showAdvanced ? Number(climateFactor) : 0.85,
      showAdvanced ? regenBraking : true,
      showAdvanced ? Number(regenFactor) : 1.05
    );

    // Sensitivity analysis
    const socValues = [10, 30, 50, 70, 90];
    const rangeSensitivity = socValues.map(s => ({
      soc: s,
      range: calculateRange(
        s, Number(batteryCapacity),
        showAdvanced ? Number(drivingConsumption) : consumption,
        showAdvanced ? Number(temperature) : 25,
        showAdvanced ? Number(baseEfficiency) : 0.98,
        showAdvanced ? Number(chargingDegradation) : 0.98,
        showAdvanced ? Number(batteryAgeCycles) : 100,
        showAdvanced ? Number(batteryAgeYears) : 2,
        showAdvanced ? Number(terrainFactor) : defaultTerrainFactor,
        showAdvanced ? climateControl : false,
        showAdvanced ? Number(climateFactor) : 0.85,
        showAdvanced ? regenBraking : true,
        showAdvanced ? Number(regenFactor) : 1.05
      ).range
    }));

    const driving = (Number(drivingConsumption) * Number(terrainFactor)).toFixed(2);
    const climate = climateControl ? (Number(drivingConsumption) * (1 - Number(climateFactor))).toFixed(2) : '0.00';
    const other = (Number(drivingConsumption) * 0.1).toFixed(2);

    return { ...stats, rangeSensitivity, consumptionBreakdown: { driving, climate, other } };
  };

  // Real-time updates with debounce
  useEffect(() => {
    if (!calculationTriggered) return;
    
    const handler = debounce(() => {
      if (validateInputs()) {
        const { range } = calculateStats();
        setPredictedRange(range);
      } else {
        setPredictedRange(null);
      }
    }, 300);
    
    handler();
    
    // No cleanup needed as debounce handles its own timeout
  }, [soc, batteryCapacity, drivingConsumption, temperature, baseEfficiency, chargingDegradation, 
      batteryAgeCycles, batteryAgeYears, terrainFactor, climateControl, climateFactor, 
      regenBraking, regenFactor, showAdvanced, calculationTriggered]);

  const handleCalculate = () => {
    setCalculationTriggered(true);
    if (validateInputs()) {
      const { range } = calculateStats();
      setPredictedRange(range);
      toast({
        title: "Range Calculated",
        description: `Estimated range: ${range} km`,
      });
    } else {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
    }
  };

  const getRangeColor = (range) => {
    const numRange = Number(range);
    if (numRange < 50) return "text-red-600";
    if (numRange < 150) return "text-orange-600";
    return "text-green-600";
  };

  const getRangeIcon = (range) => {
    const numRange = Number(range);
    if (numRange < 50) return <AlertTriangle className="w-6 h-6 text-red-600" />;
    if (numRange < 150) return <Gauge className="w-6 h-6 text-orange-600" />;
    return <Zap className="w-6 h-6 text-green-600" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              EV Range Estimator
            </h1>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1">
                  <Info className="w-5 h-5 text-blue-600" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl text-blue-600">How It Works</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Core Inputs:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li><strong>State of Charge (SOC):</strong> Current battery percentage (0-100%)</li>
                      <li><strong>Battery Capacity:</strong> Total energy capacity in kWh</li>
                      <li><strong>Driving Consumption:</strong> Energy used per 100 km in kWh</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-2">Advanced Factors:</h4>
                    <ul className="space-y-1 text-gray-700">
                      <li><strong>Temperature:</strong> Affects battery efficiency</li>
                      <li><strong>Battery Age:</strong> Considers degradation over time and cycles</li>
                      <li><strong>Terrain & Driving Style:</strong> Impact energy consumption</li>
                      <li><strong>Climate Control:</strong> Additional energy usage</li>
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get accurate range estimates for your electric vehicle based on real-world conditions and driving patterns.
          </p>
        </div>

        {/* Core Inputs */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Battery className="w-5 h-5" />
              Essential Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="soc" className="flex items-center gap-1">
                  State of Charge <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-500">(%)</span>
                </Label>
                <NumericInput
                  id="soc"
                  value={soc}
                  onChange={setSoc}
                  min={0}
                  max={100}
                  placeholder="80"
                  className="text-lg"
                />
                {soc && Number(soc) <= 10 && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Low battery warning
                  </Badge>
                )}
                {soc && (
                  <Progress value={Number(soc)} className="h-2" />
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity" className="flex items-center gap-1">
                  Battery Capacity <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-500">(kWh)</span>
                </Label>
                <NumericInput
                  id="capacity"
                  value={batteryCapacity}
                  onChange={setBatteryCapacity}
                  min={10}
                  max={200}
                  placeholder="60"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="consumption" className="flex items-center gap-1">
                  Consumption <span className="text-red-500">*</span>
                  <span className="text-sm text-gray-500">(kWh/100km)</span>
                </Label>
                <NumericInput
                  id="consumption"
                  value={drivingConsumption}
                  onChange={setDrivingConsumption}
                  min={5}
                  max={50}
                  placeholder="16"
                  className="text-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Advanced Options Toggle */}
        <div className="text-center mb-6">
          <Button
            onClick={() => setShowAdvanced(!showAdvanced)}
            variant="outline"
            size="lg"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            {showAdvanced ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
            {showAdvanced ? 'Hide' : 'Show'} Advanced Options
          </Button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Advanced Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Battery Manufacturer</Label>
                  <Select value={manufacturer} onValueChange={setManufacturer}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="panasonic">Panasonic</SelectItem>
                      <SelectItem value="lg">LG Chem</SelectItem>
                      <SelectItem value="samsung">Samsung SDI</SelectItem>
                      <SelectItem value="catl">CATL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">
                    Temperature <span className="text-red-500">*</span> (°C)
                  </Label>
                  <NumericInput
                    id="temperature"
                    value={temperature}
                    onChange={setTemperature}
                    min={-20}
                    max={50}
                    placeholder="25"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="efficiency">
                    Battery Efficiency <span className="text-red-500">*</span>
                  </Label>
                  <NumericInput
                    id="efficiency"
                    value={baseEfficiency}
                    onChange={setBaseEfficiency}
                    min={0.5}
                    max={1}
                    step={0.01}
                    placeholder="0.98"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="charging">Charging Behavior</Label>
                  <Select value={chargingBehavior} onValueChange={(value) => {
                    setChargingBehavior(value);
                    const factors = { standard: '0.98', fast: '0.90', mixed: '0.94' };
                    setChargingDegradation(factors[value] || '0.98');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (0.5C)</SelectItem>
                      <SelectItem value="fast">Fast Charging (2C)</SelectItem>
                      <SelectItem value="mixed">Mixed Usage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="degradation">
                    Charging Degradation <span className="text-red-500">*</span>
                  </Label>
                  <NumericInput
                    id="degradation"
                    value={chargingDegradation}
                    onChange={setChargingDegradation}
                    min={0.5}
                    max={1}
                    step={0.01}
                    placeholder="0.98"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cycles">
                    Battery Age <span className="text-red-500">*</span> (cycles)
                  </Label>
                  <NumericInput
                    id="cycles"
                    value={batteryAgeCycles}
                    onChange={setBatteryAgeCycles}
                    min={0}
                    max={2000}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="years">
                    Battery Age <span className="text-red-500">*</span> (years)
                  </Label>
                  <NumericInput
                    id="years"
                    value={batteryAgeYears}
                    onChange={setBatteryAgeYears}
                    min={0}
                    max={20}
                    placeholder="2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driving-style">Driving Style</Label>
                  <Select value={drivingStyle} onValueChange={(value) => {
                    setDrivingStyle(value);
                    const consumption = { eco: '14', normal: '16', aggressive: '20' };
                    setDrivingConsumption(consumption[value] || '16');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eco">Eco (Efficient)</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="aggressive">Aggressive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terrain">Terrain Type</Label>
                  <Select value={terrain} onValueChange={(value) => {
                    setTerrain(value);
                    const factors = { flat: '1.0', hilly: '1.1', mountainous: '1.2' };
                    setTerrainFactor(factors[value] || '1.0');
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="hilly">Hilly</SelectItem>
                      <SelectItem value="mountainous">Mountainous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terrain-factor">
                    Terrain Factor <span className="text-red-500">*</span>
                  </Label>
                  <NumericInput
                    id="terrain-factor"
                    value={terrainFactor}
                    onChange={setTerrainFactor}
                    min={1}
                    max={2}
                    step={0.1}
                    placeholder="1.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="climate-factor">
                    Climate Factor <span className="text-red-500">*</span>
                  </Label>
                  <NumericInput
                    id="climate-factor"
                    value={climateFactor}
                    onChange={setClimateFactor}
                    min={0.5}
                    max={1}
                    step={0.01}
                    placeholder="0.85"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="regen-factor">
                    Regen Factor <span className="text-red-500">*</span>
                  </Label>
                  <NumericInput
                    id="regen-factor"
                    value={regenFactor}
                    onChange={setRegenFactor}
                    min={1}
                    max={1.5}
                    step={0.01}
                    placeholder="1.05"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="climate-control"
                    checked={climateControl}
                    onCheckedChange={setClimateControl}
                  />
                  <Label htmlFor="climate-control">Enable Climate Control</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="regen-braking"
                    checked={regenBraking}
                    onCheckedChange={setRegenBraking}
                  />
                  <Label htmlFor="regen-braking">Regenerative Braking</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calculate Button */}
        <div className="text-center mb-6">
          <Button
            onClick={handleCalculate}
            disabled={!validateInputs()}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
          >
            <Zap className="w-5 h-5 mr-2" />
            Calculate Range
          </Button>
        </div>

        {/* Results */}
        {calculationTriggered && predictedRange && (
          <div className="space-y-6">
            {/* Main Result */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  {getRangeIcon(predictedRange)}
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Estimated Range</p>
                    <p className={`text-4xl font-bold ${getRangeColor(predictedRange)}`}>
                      {predictedRange} km
                    </p>
                    {Number(predictedRange) < 50 && (
                      <Badge variant="destructive" className="mt-2">
                        Low Range Warning
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Analysis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Core Metrics */}
                <Collapsible open={isCoreMetricsOpen} onOpenChange={setIsCoreMetricsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span className="font-semibold text-blue-600">Core Metrics</span>
                      {isCoreMetricsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Effective Capacity</p>
                        <p className={`font-semibold ${Number(calculateStats().effectiveCapacity) < Number(batteryCapacity) * 0.2 ? 'text-red-600' : 'text-gray-900'}`}>
                          {calculateStats().effectiveCapacity} kWh
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Energy Consumption</p>
                        <p className="font-semibold">{calculateStats().energyConsumption} kWh/100km</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Total Degradation</p>
                        <p className={`font-semibold ${Number(calculateStats().totalDegradation) > 10 ? 'text-red-600' : 'text-gray-900'}`}>
                          {calculateStats().totalDegradation}%
                        </p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Cycle Degradation</p>
                        <p className="font-semibold">{calculateStats().cycleDegradation}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Calendar Degradation</p>
                        <p className="font-semibold">{calculateStats().calendarDegradation}%</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Temperature Factor</p>
                        <p className="font-semibold">{calculateStats().tempFactor}</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Consumption Breakdown */}
                <Collapsible open={isConsumptionOpen} onOpenChange={setIsConsumptionOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span className="font-semibold text-blue-600">Consumption Breakdown</span>
                      {isConsumptionOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-600">Driving</p>
                        <p className="font-semibold text-blue-700">{calculateStats().consumptionBreakdown.driving} kWh/100km</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-sm text-gray-600">Climate Control</p>
                        <p className="font-semibold text-orange-700">{calculateStats().consumptionBreakdown.climate} kWh/100km</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Other Losses</p>
                        <p className="font-semibold">{calculateStats().consumptionBreakdown.other} kWh/100km</p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Separator />

                {/* Range Sensitivity */}
                <Collapsible open={isSensitivityOpen} onOpenChange={setIsSensitivityOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <span className="font-semibold text-blue-600">Range Sensitivity to SOC</span>
                      {isSensitivityOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {calculateStats().rangeSensitivity.map(({ soc, range }) => (
                        <div key={soc} className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg text-center">
                          <p className="text-sm text-gray-600">SOC {soc}%</p>
                          <p className={`font-semibold ${Number(range) < 50 ? 'text-red-600' : 'text-gray-900'}`}>
                            {range} km
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
