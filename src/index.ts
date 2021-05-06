import * as d3 from "d3";
import * as topojson from "topojson-client";
const colombiajson = require("./colombia-departments.json");
import { latLongDepartaments } from "./departaments";
import { Entry, totalCases, recovered, deceased } from "./dataDepartaments";

const affectedRadiusScale = d3
  .scaleThreshold<number, number>()
  .domain([20, 50, 200, 1000, 10000, 300000, 500000])
  .range([2, 4, 8, 10, 15, 20, 25]);

let data = totalCases;

const calculateRadiusBasedOnAffectedCases = (comunidad: string) => {
  const entry = data.find((item) => item.name === comunidad);

  return entry ? affectedRadiusScale(entry.value) : 0;
};

// Tooltip
const div = d3
  .select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

const svg = d3
  .select("body")
  .append("svg")
  .attr("width", 800)
  .attr("height", 500)
  .attr("style", "background-color: #FBFAF0");

const aProjection = d3
  .geoMercator()
  // Let's make the map bigger to fit in our resolution
  .scale(1500)
  // Let's center the map
  .center([-74, 4.5])
  .translate([300, 250]);

const geoPath = d3.geoPath().projection(aProjection);
const geojson = topojson.feature(colombiajson, colombiajson.objects.COL_adm1);

svg
  .selectAll("path")
  .data(geojson["features"])
  .enter()
  .append("path")
  .attr("class", "country")
  // data loaded from json file
  .attr("d", geoPath as any)
  .attr("fill", "#649B92");

svg
  .selectAll("circle")
  .data(latLongDepartaments)
  .enter()
  .append("circle")
  .attr("class", "affected-marker")
  .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name))
  .attr("cx", (d) => aProjection([d.long, d.lat])[0])
  .attr("cy", (d) => aProjection([d.long, d.lat])[1])
  .attr("fill", "#ff8066")
  .on("mouseover", function (e: any, datum: any) {
    const affected = data.find((item) => item.name === datum.name).value;
    const coords = { x: e.x, y: e.y };
    div.transition().duration(200).style("opacity", 0.9);
    div
      .html(`<span>${datum.name}: ${affected}</span>`)
      .style("left", `${coords.x}px`)
      .style("top", `${coords.y - 28}px`);
  })
  .on("mouseout", function (datum) {
    div.transition().duration(500).style("opacity", 0);
  });

const updateChart = (updatedData: Entry[], color: string) => {
  data = updatedData;
  d3.selectAll("circle")
    .data(latLongDepartaments)
    .transition()
    .duration(500)
    .attr("r", (d) => calculateRadiusBasedOnAffectedCases(d.name))
    .attr("fill", color);
};

document
  .getElementById("total")
  .addEventListener("click", function handlTotalCases() {
    updateChart(totalCases, "#ff8066");
  });

document
  .getElementById("recovered")
  .addEventListener("click", function handlRecovered() {
    updateChart(recovered, "#006E8A");
  });

document
  .getElementById("deceased")
  .addEventListener("click", function handlDeceased() {
    updateChart(deceased, "#56423D");
  });
