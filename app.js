window.onload = function() {
    window.scrollTo(0, 0);
  };
  var waveHeightDictionary = {};
  var averageWaveHeightDictionary = {};
  let averageWaveHeight= {}
  const file_dir = "data_input";

  const monthDict = {
    1: "Jan.",
    2: "Feb.",
    3: "Mar.",
    4: "Apr.",
    5: "May",
    6: "Jun.",
    7: "Jul.",
    8: "Aug.",
    9: "Sep.",
    10: "Oct.",
    11: "Nov.",
    12: "Dec."
  };

  const locs = {
    '028': { lat: 33.85993, long: -118.64110 },
    '215': {lat: 33.70033, long: -118.20067},
    '045': { lat: 33.17942, long: -117.47128 },
    '073': { lat: 32.866667, long: -117.256667 },
    '100': { lat: 32.93000, long: -117.39000 },
    '153': { lat: 32.95658, long: -117.27945 },
    '155': { lat: 32.56968, long: -117.16895 },
    '191': { lat: 32.51670, long: -117.42520 },
    '220': { lat: 32.74942, long: -117.50169 }
  };
  let selectedDate = new Date('2021-01-02');
  const map = L.map("visualization");
  let circles;


  function parseCSV(file, callback) {
    d3.csv(file_dir + "/" + file, d3.autoType)
      .then(callback)
      .catch((error) => {
        console.error('Error reading CSV file:', error);
      });
  }

  function processCSVFiles(files,hour=8) {
    waveHeightDictionary = {};
    averageWaveHeightDictionary = {};
    files.forEach((file) => {
      parseCSV(file, (data) => {
      data.forEach((row) => {
          var YEAR = row["YEAR"];
          var MO = row["MO"].toString().padStart(2, "0");
          const DY = row["DY"].toString().padStart(2, "0");
          const BUOY = row["BUOY"];
          const Hs = row["Hs"]*3.28084;
          const date = new Date(`${YEAR}-${MO}-${DY}`);
          const waveHeight = parseFloat(Hs);
          const tempAir = parseFloat(row["Ta"]);
          const key = date.toISOString();
        if(((row.HR==hour) && (row.MN==30)) || ((row.HR==hour) && (row.MN==45))){
          if(row["Hs"]<10){
            

            
            if (!waveHeightDictionary[key]) {
              waveHeightDictionary[key] = [];
            }
           

            waveHeightDictionary[key].push({ buoyName: BUOY, waveHeight: waveHeight, tempAir: tempAir });
          }
        } 
        if(row.HR==hour && row["Hs"]<10){
          if (!averageWaveHeightDictionary[key]) {
            averageWaveHeightDictionary[key] = [];
          }
         
  
          averageWaveHeightDictionary[key].push({waveHeight: waveHeight});
        }
        

        });
        updateVisualization(selectedDate);
      });
      
    });
    
  }

  const colorScale = d3.scaleSequential()
      .domain([30, 5]) 
      .interpolator(d3.interpolateRdYlBu); 

  function updateVisualization(selectedDate) {
    const formattedDate = selectedDate.toISOString();
    const data = waveHeightDictionary[formattedDate];

    if (!map.hasLayer(circles)) {
      map.setView([33.5, -117.8], 8);
     L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri',
      maxZoom: 13
    }).addTo(map)
      circles = L.featureGroup().addTo(map);

    } else {
      circles.clearLayers();
    }

      data.forEach((d) => {
      const buoyLocation = locs[d.buoyName.split("_")[0]];
      if (isNaN(d.tempAir)) {
        color = "rgba(0, 0, 0, 0)"; 
      } else {
          color = colorScale(d.tempAir);
      }
        circle = L.circle([buoyLocation.lat, buoyLocation.long], {
        radius: d.waveHeight*800,
        fillColor: color,
        color: "black",
        weight: 1,
        fillOpacity: 1,
      }).addTo(circles);
  
      let buoy_name= d.buoyName.split("_")
      buoy_name=buoy_name.slice(1).join("_")
      const text = L.divIcon({
          className: 'marker-text',
          html: `<div>${buoy_name}</div><div>${(d.waveHeight).toFixed(2)}ft</div>`,
      });
      L.marker([buoyLocation.lat, buoyLocation.long], {
          icon: text,
          interactive: true,
      }).addTo(circles);
    });
    

    

    const currentDateDiv = d3.select("#current-date");
    currentDateDiv.text(`Current Date: ${selectedDate.toLocaleDateString()}`)
    .style("font-size","25px")
    .style("margin-top", "40px");
  }

  function initializeSlider() {
    const sliderContainer = document.getElementById("slider-container");
    const slider = noUiSlider.create(sliderContainer, {
      range: {
        min: new Date('2021-01-01').getTime(),
        max: new Date('2021-12-31').getTime(),
      },
      start: new Date('2021-01-02').getTime(),
      step: 24 * 60 * 60 * 1000,
      connect: true,
      tooltips: true,
      tooltips: {
          to: function (value) {
              selectedDate = new Date(parseInt(value));
              return selectedDate.toLocaleDateString();
          }
      }
    });

    slider.on("slide", (values) => {
      const selectedDate = new Date(+values[0]) ;
      updateVisualization(selectedDate);
    });

  }
  const files=['028_santa_monica.csv', '045_oceanside_offshore.csv', '073_scripps_pier.csv', '100_torrey_pines_outer.csv', '153_del_mar_nearshore.csv', '155_imperial_beach.csv', '191_point_loma_south.csv', '220_mission_bay_west.csv','215_long_beach_channel.csv']
  initializeSlider();
  processCSVFiles(files);

  setTimeout(function() {
      createChart();
      createAverageChart();
  }, 500);
  

  let hourDropdown = document.getElementById('hourDropdown');
  hourDropdown.value = "8";
  hourDropdown.addEventListener('change', function() {
    let selectedHour = hourDropdown.value;
    processCSVFiles(files,+selectedHour)
    console.log('Selected hour:', selectedHour);
    setTimeout(function() {
      createChart();
      createAverageChart();
    }, 500);
  });

let buoyDropdown = document.getElementById('buoyDropdown');
buoyDropdown.value = "028_santa_monica";
buoyDropdown.addEventListener('change', function() {
  selectedBuoy = buoyDropdown.value;
  console.log('Selected Buoy:', selectedBuoy);
  createChart(selectedBuoy)
});

d3.select('#hourDropdown')
.style("margin-bottom","20px");

d3.select('#buoyDropdown')
.style("margin-bottom","10px");

function createChart(selectedBuoy = "028_santa_monica") {
  const svgWidth = 1400;
  const svgHeight = 800;
  const margin = { top: 150, right: 70, bottom: 100, left: 70 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;
  d3.select("#bar-chart svg").remove();

  const svg = d3.select("#bar-chart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const dates = Object.keys(waveHeightDictionary);
  console.log(dates)

  const waveHeights = dates.map(date => {
    const data = waveHeightDictionary[date];
    const waveHeight = data.find(d => d.buoyName === selectedBuoy);
    return { date, waveHeight: waveHeight ? waveHeight.waveHeight : 0 };
  });
  let buoyName=buoyDropdown.value.split("_")
    .slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  let selectedOption=hourDropdown.options[hourDropdown.selectedIndex];
  const hourLabel = selectedOption.text;

  chart
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -margin.bottom*.2)
    .attr("text-anchor", "middle")
    .style("font-size", "30px")
    .text(`Wave Heights for ${buoyName} : ${hourLabel} 2021`);
  chart
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - svgHeight / 2 + margin.top)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "23px")
    .text("Wave Height (ft)");
  chart
    .append("text")
    .attr("x", svgWidth / 2.15)
    .attr("y", svgHeight - margin.bottom*1.8)
    .style("text-anchor", "middle")
    .style("font-size", "23px")
    .text("Time");
  svg
    .insert("rect", ":first-child")
    .attr("width", chartWidth)
    .attr("height", chartHeight)
    .attr("fill", "#FAFAF9")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  

  const xScale = d3.scaleBand()
    .domain(dates)
    .range([0, chartWidth])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(waveHeights, d => d.waveHeight)])
    .range([chartHeight, 0]);

  const xAxis = d3.axisBottom(xScale)
    .tickValues(dates.filter((d, i) => i % 30 === 0))
    .tickFormat(d3.timeFormat("%B"));
  const yAxis = d3.axisLeft(yScale);

  chart.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("font-size", "18px")
    .style("text-anchor", "end")
    .text((d, i) => monthDict[i+1]);
  chart.append("g")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "18px");

  chart.selectAll(".bar")
    .data(waveHeights)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.date))
    .attr("y", d => yScale(d.waveHeight))
    .attr("width", xScale.bandwidth())
    .attr("height", d => chartHeight - yScale(d.waveHeight))
    .attr("fill", "steelblue");
}

function createAverageChart(selectedBuoy = "028_santa_monica") {
  console.log(averageWaveHeightDictionary)
  const svgWidth = 1400;
  const svgHeight = 800;
  const margin = { top: 150, right: 70, bottom: 100, left: 70 };
  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;
  d3.select("#average-bar-chart svg").remove();

  const svg = d3.select("#average-bar-chart")
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  const averageWaveHeights = {};
  for (const key in averageWaveHeightDictionary) {
    const data = averageWaveHeightDictionary[key];
    const totalWaveHeight = data.reduce((sum, entry) => sum + entry.waveHeight, 0);
    const averageWaveHeight = totalWaveHeight / data.length;
  
    averageWaveHeights[key] = averageWaveHeight;
  }
  const dates = Object.keys(averageWaveHeights);
  console.log(dates)

  const xScale = d3.scaleBand()
    .domain(dates)
    .range([0, chartWidth])
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(Object.values(averageWaveHeights))]) // Use Object.values to get the array of average wave heights
    .range([chartHeight, 0]);
  
  const xAxis = d3.axisBottom(xScale)
    .tickValues(dates.filter((d, i) => i % 30 === 0))
    .tickFormat(d3.timeFormat("%B"));

  const yAxis = d3.axisLeft(yScale);

  chart.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("font-size", "18px")
    .style("text-anchor", "end");
  
  chart
    .append("text")
    .attr("x", chartWidth / 2)
    .attr("y", -margin.bottom*.2)
    .attr("text-anchor", "middle")
    .style("font-size", "30px")
    .text(`All Buoys Wave Height Average Over 2021`);
  chart
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - svgHeight / 2 + margin.top)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .style("font-size", "23px")
    .text("Wave Height (ft)");
  
  chart
    .append("text")
    .attr("x", svgWidth / 2.15)
    .attr("y", svgHeight - margin.bottom*1.8)
    .style("text-anchor", "middle")
    .style("font-size", "23px")
    .text("Time");

  chart.append("g")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "18px");

  chart.append("g")
    .attr("transform", `translate(0, ${chartHeight})`)
    .call(xAxis)
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("font-size", "18px")
    .style("text-anchor", "end")
    .text((d, i) => monthDict[i+1]);

  chart.selectAll(".bar")
    .data(Object.keys(averageWaveHeights).map(key => ({ date: key, averageWaveHeight: averageWaveHeights[key] })))
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.date))
    .attr("y", d => yScale(d.averageWaveHeight))
    .attr("width", xScale.bandwidth())
    .attr("height", d => chartHeight - yScale(d.averageWaveHeight))
    .attr("fill", "steelblue");
}
