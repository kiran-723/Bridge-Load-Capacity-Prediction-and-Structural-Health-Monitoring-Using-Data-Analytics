angular.module('BridgeApp', [])
.controller('DashboardController', ['$scope', '$http', function ($scope, $http) {
    var vm = this;

    vm.bridges = [];
    vm.summary = {
        total: 0,
        safe: 0,
        critical: 0,
        observation: 0,
        avgCapacity: 0,
        avgLoad: 0,
        maxCapacity: 0,
        safePercent: 0
    };

    vm.selectedBridge = {};
    vm.inputAge = 0;
    vm.inputLoad = 0;
    vm.prediction = {
        capacity: 0,
        load: 0,
        percent: 0,
        status: 'N/A'
    };

    vm.alerts = [
        { title: 'High Stress Detected', message: 'Bridge B-0978 is under high structural load.', time: '25 May 2025 · 10:30 AM' },
        { title: 'Inspection Required', message: 'Bridge B-0965 requires detailed inspection soon.', time: '25 May 2025 · 09:15 AM' },
        { title: 'Maintenance Scheduled', message: 'Bridge B-1024 maintenance scheduled for 30 May 2025.', time: '25 May 2025 · 08:45 AM' }
    ];

    vm.statusClass = function (bridge) {
        if (!bridge || !bridge.Status) {
            return 'badge-safe';
        }
        return bridge.Status === 'SAFE' ? 'badge-safe' : bridge.Status === 'CRITICAL' ? 'badge-critical' : 'badge-warning';
    };

    vm.onBridgeSelected = function () {
        if (!vm.selectedBridge) return;
        vm.inputAge = vm.selectedBridge.Age;
        vm.inputLoad = vm.selectedBridge.CurrentLoad_kN;
        vm.updatePrediction();
        vm.updateGauge(vm.selectedBridge.Ratio);
    };

    vm.selectBridge = function (bridge) {
        vm.selectedBridge = bridge;
        vm.onBridgeSelected();
    };

    vm.runPrediction = function () {
        if (!vm.selectedBridge || !vm.selectedBridge.BridgeID) return;
        vm.updatePrediction();
        vm.updateGauge(vm.prediction.percent);
    };

    vm.updatePrediction = function () {
        var selected = vm.selectedBridge || {};
        var design = selected.DesignCapacity_kN || 5000;
        var predictedCapacity = Math.max(0, design - (vm.inputAge * 10) + (selected.Span_m || 0) * 2);
        var currentLoad = vm.inputLoad || selected.CurrentLoad_kN || 0;
        var percent = predictedCapacity > 0 ? (currentLoad / predictedCapacity) * 100 : 100;

        vm.prediction.capacity = predictedCapacity;
        vm.prediction.load = currentLoad;
        vm.prediction.percent = percent;
        vm.prediction.status = percent >= 100 ? 'CRITICAL' : percent >= 80 ? 'UNDER OBSERVATION' : 'SAFE';
    };

    vm.updateGauge = function (percent) {
        if (window.Phics && window.Phics.animateGauge) {
            window.Phics.animateGauge('bridgeGauge', 0, percent, 900);
        }
    };

    function parseCSV(csvText) {
        var lines = csvText.trim().split('\n');
        var headers = lines.shift().split(',');
        return lines.map(function (line) {
            var cells = line.split(',');
            var row = {};
            headers.forEach(function (header, index) {
                row[header] = cells[index];
            });
            row.Age = parseInt(row.Age, 10);
            row.Span_m = parseFloat(row.Span_m);
            row.Width_m = parseFloat(row.Width_m);
            row.CurrentLoad_kN = parseFloat(row.CurrentLoad_kN);
            row.DesignCapacity_kN = parseFloat(row.DesignCapacity_kN);
            row.NoOfSpans = parseInt(row.NoOfSpans, 10);
            row.Ratio = row.DesignCapacity_kN === 0 ? 0 : Math.round((row.CurrentLoad_kN / row.DesignCapacity_kN) * 100);
            row.Status = row.Ratio >= 100 ? 'CRITICAL' : row.Ratio >= 80 ? 'UNDER OBSERVATION' : 'SAFE';
            return row;
        });
    }

    function updateSummary() {
        vm.summary.total = vm.bridges.length;
        vm.summary.safe = vm.bridges.filter(function (bridge) { return bridge.Status === 'SAFE'; }).length;
        vm.summary.critical = vm.bridges.filter(function (bridge) { return bridge.Status === 'CRITICAL'; }).length;
        vm.summary.observation = vm.bridges.filter(function (bridge) { return bridge.Status === 'UNDER OBSERVATION'; }).length;
        vm.summary.avgCapacity = vm.bridges.length ? Math.round((vm.bridges.reduce(function (sum, bridge) { return sum + bridge.Ratio; }, 0) / vm.bridges.length) * 10) / 10 : 0;
        vm.summary.avgLoad = vm.bridges.length ? vm.bridges.reduce(function (sum, bridge) { return sum + bridge.CurrentLoad_kN; }, 0) / vm.bridges.length : 0;
        vm.summary.maxCapacity = vm.bridges.length ? Math.max.apply(null, vm.bridges.map(function (bridge) { return bridge.DesignCapacity_kN; })) : 0;
        vm.summary.safePercent = vm.summary.total ? Math.round((vm.summary.safe / vm.summary.total) * 100) : 0;
    }

    function loadBridgeData(csvText) {
        vm.bridges = parseCSV(csvText);
        if (vm.bridges.length > 0) {
            vm.selectedBridge = vm.bridges[0];
            vm.inputAge = vm.selectedBridge.Age;
            vm.inputLoad = vm.selectedBridge.CurrentLoad_kN;
            vm.updatePrediction();
            vm.updateGauge(vm.selectedBridge.Ratio);
        }
        updateSummary();
        $scope.$applyAsync();
    }

    function loadFallbackData() {
        var fallbackCSV = 'BridgeID,Location,Type,Age,Span_m,Width_m,Material,CurrentLoad_kN,DesignCapacity_kN,YearBuilt,NoOfSpans\n' +
            'B-1024,River Side Area,Beam Bridge,25,120,12.5,Steel & Concrete,3500,5000,2000,6\n' +
            'B-1018,City Overpass,Cantilever,18,95,11,Steel,2800,3600,2004,5\n' +
            'B-1005,Hill Station Road,Suspension,32,180,13,Steel,4200,4800,1995,8\n' +
            'B-0992,Sea Link Road,Arch Bridge,20,130,14,Concrete,5100,5600,2008,7\n' +
            'B-0981,Village Road,Truss Bridge,12,80,10.5,Steel & Concrete,2300,3000,2015,4\n' +
            'B-1100,Coastal Route,Beam Bridge,22,110,12,Concrete,3400,4500,2003,5\n' +
            'B-1122,Forest Pass,Suspension,28,200,15,Steel,4700,5300,1998,10\n' +
            'B-1145,Metro Link,Cable-Stayed,16,145,13.5,Steel,3100,4200,2010,6';
        loadBridgeData(fallbackCSV);
    }

    function init() {
        if (window.fetch) {
            fetch('data/bridge_data.csv').then(function (response) {
                if (!response.ok) {
                    throw new Error('CSV file not loaded');
                }
                return response.text();
            }).then(loadBridgeData)
            .catch(loadFallbackData);
        } else {
            loadFallbackData();
        }
    }

    init();
}]);
