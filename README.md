# Task2. Advanced Task

We choose a new country to apply the data.

I choosed Colombia.

# Steps

- Let's take _task1_ as an initial example, copy the contents of that folder and run _npm install_.

```bash
npm install
```

- We have to look for colombia Covid data. We can find it in the goverment website:

  _https://www.ins.gov.co/Noticias/paginas/coronavirus.aspx_

- With this data we create _dataDepartment.ts_, we collect data on the number total infected, recovered and deceased.

- We also need the coordinates of each of the departments of Colombia. We found it on this website:

  _https://blog.jorgeivanmeza.com/2008/09/departamentos-y-municipios-de-colombia-actualizacion-20080915/_.

- With this we create the file _departaments.ts_

- Now that we have all the data we need the json to build the map. We download it from:

  _https://github.com/deldersveld/topojson/tree/master/countries_

- In the _index.ts_ file we import D3, topojson and all the above files.

_./src/index.ts_

```diff
+ import * as d3 from "d3";
+ import * as topojson from "topojson-client";
+ const colombiajson = require("./colombia-departments.json");
+ import { latLongDepartaments } from "./departaments";
+ import { Entry, totalCases, recovered, deceased } from "./dataDepartaments";
```

- After that we create a svg to contain the map:

_./src/index.ts_

```diff
+ const svg = d3
+  .select("body")
+  .append("svg")
+  .attr("width", 800)
+  .attr("height", 500)
+  .attr("style", "background-color: #FBFAF0");
```

- We add the projection, to make the map bigger to fit in our resolution with scale and center the map,
  with translate and center options. Then we add the map to the previous svg with Colombia json data.

_./src/index.ts_

```diff
+ const aProjection = d3
+  .geoMercator()
+  .scale(1500)
+  .center([-74, 4.5])
+  .translate([300, 250]);

+ const geoPath = d3.geoPath().projection(aProjection);
+ const geojson = topojson.feature(colombiajson, colombiajson.objects.COL_adm1);

+ svg
+  .selectAll("path")
+  .data(geojson["features"])
+  .enter()
+  .append("path")
+  .attr("class", "country")
+  // data loaded from json file
+  .attr("d", geoPath as any)
+  .attr("fill", "#649B92");

```

- On the _index.html_ we create a three buttons to update the data, we also add some informative titles.

_./src/index.ts_

```diff
+  <h2>Colombia Covid 19 Data</h2>
+    <h5>Updated (03/05/2021)</h5>
+    <div class="buttons">
+      <button id="total">Total Cases</button>
+      <button id="recovered">Recovered</button>
+      <button id="deceased">Deceased</button>
+    </div>
```

- We have very differents ranges in the data on fatalities(13-10000) and in recovered and infected data(1300 - 500000).

- For this reason we use the scale threshold, and add a domain and range.

_./src/index.ts_

```diff
+ const affectedRadiusScale = d3
+  .scaleThreshold<number, number>()
+  .domain([20, 50, 200, 1000, 10000, 300000, 500000])
+  .range([2, 4, 8, 10, 15, 20, 25]);
```

- We also added a method to assign each departament a radius.

_./src/index.ts_

```diff
+ const calculateRadiusBasedOnAffectedCases = (comunidad: string) => {
+   const entry = data.find((item) => item.name === comunidad);
+
+   return entry ? affectedRadiusScale(entry.value) : 0;
+ };
```

- We add the circles for each departaments, with a radious based on the cases and a fill.
  We use the latitude and longitude for each departament to draw the circles.

_./src/index.ts_

```diff
+ svg
+  .selectAll("circle")
+  .data(latLongDepartaments)
+  .enter()
+  .append("circle")
+  .attr("class", "affected-marker")
+  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name))
+  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
+  .attr("cy", (d) => aProjection([d.long, d.lat])[1])
+  .attr("fill", "#ff8066")
```

- We also have to add it to the update method, so that when clicking on the buttons,
  the radios of the circle are painted with the new data. We also change the colour of the circles
  depending on the type of data: recovered, deceased or infected.

_./src/index.ts_

```diff
+ const updateChart = (updatedData: Entry[], color: string) => {
+  data = updatedData;
+  d3.selectAll("circle")
+    .data(latLongDepartaments)
+    .transition()
+    .duration(500)
+    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name))
+    .attr("fill", color);
+ };
```

- Let's add events listener to this buttons, to update the chart when we click on it.

_./src/index.ts_

```diff
+ document
+  .getElementById("total")
+  .addEventListener("click", function handlTotalCases() {
+    updateChart(totalCases, "#ff8066");
+  });

+ document
+  .getElementById("recovered")
+  .addEventListener("click", function handlRecovered() {
+    updateChart(recovered, "#006E8A");
+  });

+ document
+  .getElementById("deceased")
+  .addEventListener("click", function handlDeceased() {
+    updateChart(deceased, "#56423D");
+  });
```

- To better see the number of people affected in each community we decided to implement a tooltip.

- First we add a div, with class 'tooltip' and opacity 0 to the body.

_./src/index.ts_

```diff
+ // Tooltip
+ const div = d3
+  .select("body")
+  .append("div")
+  .attr("class", "tooltip")
+  .style("opacity", 0)
```

- Let's add mouse events to the circles, on mouseover, we look for the number of affected
  in the data variable, then the coordinates in the mouse event.
- We add a transition in div.tooltip and change the opcity to 0.9, to see the div.
- We create a span, where add the information _name: number of affected_ and the coordinates.
- On mouseout, to hide the tooltip we change the opacity to 0..

_./src/index.ts_

```diff
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name))
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1]);
  .attr("cy", (d) => aProjection([d.long, d.lat])[1])
  .attr("fill", "#ff8066")
+  .on("mouseover", function (e: any, datum: any) {
+    const affected = data.find((item) => item.name === datum.name).value;
+    const coords = { x: e.x, y: e.y };
+    div.transition().duration(200).style("opacity", 0.9);
+    div
+      .html(`<span>${datum.name}: ${affected}</span>`)
+      .style("left", `${coords.x}px`)
+      .style("top", `${coords.y - 28}px`);
+  })
+  .on("mouseout", function (datum) {
+    div.transition().duration(500).style("opacity", 0);
+  });
```

- We add a new file, _styles.css_ where to apply the styles for the tooltip.

_./src/styles.css_

```diff
+ div.tooltip {
+  position: absolute;
+  text-align: center;
+  width: 80px;
+  height: 30px;
+  padding: 2px;
+  font: 12px sans-serif;
+  background: #f7f2cb;
+  border: 0px;
+  border-radius: 8px;
+  pointer-events: none;
+}
```

- Lastly, add this file into _index.html_'.

_./src/index.html_

```diff
  <head>
    <link rel="stylesheet" type="text/css" href="./map.css" />
    <link rel="stylesheet" type="text/css" href="./base.css" />
+    <link rel="stylesheet" type="text/css" href="./styles.css" />
  </head>
```

- We will also add styling to the buttons and headings.

_./src/styles.css_

```diff
+ div.buttons {
+  width: 90%;
+  margin: auto;
+ }

+ h2,
+ h5 {
+  width: 90%;
+  margin: auto;
+  color: #007663;
+  background-color: white;
+ }

+ button {
+  margin: 20px;
+  padding: 12px;
+  border: none;
+  background: #ff9671;
+  color: white;
+  border-radius: 8px;
+ }
```
