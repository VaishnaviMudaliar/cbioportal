function PancancerStudySummaryHistogram()
{
	
	// Some semi-global utilities
    // Here are some options that we will use in this view
    var width = 1100;
    var height = 550;
    var paddingLeft = 80;
    var paddingRight = 50;
    var paddingTop = 10;
    var histBottom = 400;
    var fontFamily = "sans-serif";
    var animationDuration = 1000;
    var maxStudyBarWidth = 30;

	var getStudyWidth = function (histData){
		return Math.min(((width - (paddingLeft + paddingRight)) / histData.length) * .75, maxStudyBarWidth);
	}
    var defaultQTipOptions = {
        content: {
            text: "Default qtip text"
        },
        hide: {
            fixed: true,
            delay: 250,
            event: 'mouseout'
        },
        show: {
            event: 'mouseover'
        },
        style: {
            classes: 'qtip-light qtip-rounded qtip-shadow cc-cancer-type-tip cc-ui-tooltip'
        },
        position: {
        	my:'bottom left', 
        	at:'top center',
        	viewport: $(window)
        }
    };
    
    var calculateFrequency = function(d, type) {
        return d.alterations[type]/ d.caseSetLength;
    };

    var getYValue = function(d, type, dataTypeYAxis) {
	    if (dataTypeYAxis == "Absolute Counts")
	    	return d.alterations[type];
	    else
	    	return calculateFrequency(d, type);
    };
  

    var getTypeOfCancer = function(study) {
    	return study.typeOfCancer; 
    };
    
    var filterCriteriaChanged = function(model) {
    	return model.hasChanged("cancerType") || model.hasChanged("cancerTypeDetailed") || model.hasChanged("minNrAlteredSamples");
    }
    
    
    //render histogram method:
	this.render = function(histogramEl, model, dmPresenter, geneId){
		this.model = model;
	    
		//if data will change, e.g. because a cancer type was added or removed to the 
		//filter criteria, then get processed data again: 
	    if (filterCriteriaChanged(model)) {
	    	//get data via presenter layer:
			this.histogramPresenter = new HistogramPresenter(model, dmPresenter, geneId);
			//Get data:
		    this.histogramPresenter.getJSONDataForHistogram(function (histData) {
		    	//sort data:
		    	sortItems(histData, model);
		    	//draw histogram. 
		    	var histogram = drawHistogram(histData, model, histogramEl);
		    });
	    }
	    else {
	    	var histData = this.histogramPresenter.histData;
	    	//only sorting/scaling has changed. Adjust/redraw histogram accordingly:
	    	var histogram = drawHistogram(histData, model, histogramEl);
			//animation, sorting also the histogram:
			sortItems(histData, model, histogram);
	    }
	}
	    
    var drawHistogram = function(histData, model, histogramEl) {
		//var metaData = metadata_temp;
		
    	var getY = function(d, type) {
    		return getYValue(d, type, model.get("dataTypeYAxis"));
    	};
    	
    	var getYlabel = function(d) {
	    	if (model.get("dataTypeYAxis") == "Absolute Counts")
	    		return d
	    	else
	    		return Math.round(parseFloat(d) * 100) + "%"; 
	    };
    	
		// main values: 
	    var studyWidth = getStudyWidth(histData);
	    var studyLocIncrements = studyWidth / .75;
	    // Data type radius
	    var circleDTR = studyWidth / 4;
	    // Tumor type radius
	    var circleTTR = Math.min(studyWidth, 20) / 2;

	    var key = function(d) {
	        return d.typeOfCancer;
	    };

	    var yMax = parseFloat(d3.max(histData, function (d) {
            return getY(d, "all");
        })) + .05;
	    //alert(yMax);
	    
	    var yScale = d3.scale.linear()
	        .domain([
	        0,
	        yMax
	    ])
	    .range([histBottom-paddingTop, 0]);    

		var isThereHetLoss = false;
		var isThereGain = false;
		var isThereMutation = false;
		var isThereAmplification = false;
		var isThereDeletion = false;
		var isThereMultiple = false;
		
		// Empty the content
	    $(histogramEl).html("");
	
	    // and initialize the histogram
	    var histogram = d3.select(histogramEl)
	        .append("svg")
	        .attr("width", width)
	        .attr("height", height);
	
	    // define Y axis
	    var yAxis = d3.svg.axis()
	        .scale(yScale)
	        .orient("left");
	    //keep track of bar groups:
	    histogram._xGroups = [];
	    var multipleTypesGroup = histogram.append("g");
	    histogram._xGroups.push(multipleTypesGroup);
	    multipleTypesGroup.selectAll("rect")
	        .data(histData, key)
	        .enter()
	        .append("rect")
	        .attr("fill", "#aaaaaa")
	        .attr("x", function(d, i) { return paddingLeft + i * studyLocIncrements; } )
	        .attr("y", function(d, i) { return yScale(getY(d, "multiple")) + paddingTop; })
	        .attr("width", studyWidth)
	        .attr("height", function(d, i) {
	            return (histBottom-paddingTop) - yScale(getY(d, "multiple"));
	        })
	        .style("stroke", "white")
	        .style("stroke-width", "1")
	        .attr("class", function(d, i) { 
	        	//keep track of whether there is data in this type:
	        	if (getY(d, "multiple") > 0) {isThereMultiple = true}
	        	return d.typeOfCancer + " alt-other"; })
	    ;
	
	    var mutBarGroup = histogram.append("g");
	    histogram._xGroups.push(mutBarGroup);
	    mutBarGroup.selectAll("rect")
	        .data(histData, key)
	        .enter()
	        .append("rect")
	        .attr("fill", "green")
	        .attr("x", function(d, i) { return paddingLeft + i * studyLocIncrements; } )
	        .attr("y", function(d, i) {
	            return yScale(getY(d, "mutation"))
	                - ((histBottom-paddingTop) - yScale(getY(d, "multiple")))
	                + paddingTop;
	        })
	        .attr("width", studyWidth)
	        .attr("height", function(d, i) {
	            return (histBottom-paddingTop) - yScale(getY(d, "mutation"));
	
	        })
	        .style("stroke", "white")
	        .style("stroke-width", "1")
	        .attr("class", function(d, i) { 
	        	//keep track of whether there is data in this type:
	        	if (getY(d, "mutation") > 0) {isThereMutation = true}
	        	return d.typeOfCancer + " alt-mut";
	        })
	    ;
	
	    var cnalossBarGroup = histogram.append("g");
	    histogram._xGroups.push(cnalossBarGroup);
	    cnalossBarGroup.selectAll("rect")
	        .data(histData, key)
	        .enter()
	        .append("rect")
	        .attr("fill", "skyblue")
	        .attr("x", function(d, i) { return paddingLeft + i * studyLocIncrements; } )
	        .attr("y", function(d, i) {
	            return yScale(getY(d, "cnaLoss"))
	                - (
	                ((histBottom-paddingTop) - yScale(getY(d, "mutation")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "multiple")))
	                )
	                + paddingTop;
	        })
	        .attr("width", studyWidth)
	        .attr("height", function(d, i) {
	            return (histBottom-paddingTop) - yScale(getY(d, "cnaLoss"));
	        })
	        .style("stroke", "white")
	        .style("stroke-width", "1")
	        .attr("class", function(d, i) { 
	        	if (getY(d, "cnaLoss") > 0) {isThereHetLoss = true}
	        	return d.typeOfCancer + " alt-cnaloss"; 
	        })
	    ;
	
	
	    var cnadownBarGroup = histogram.append("g");
	    histogram._xGroups.push(cnadownBarGroup);
	    cnadownBarGroup.selectAll("rect")
	        .data(histData, key)
	        .enter()
	        .append("rect")
	        .attr("fill", "blue")
	        .attr("x", function(d, i) { return paddingLeft + i * studyLocIncrements; } )
	        .attr("y", function(d, i) {
	            return yScale(getY(d, "cnaDown"))
	                - (
	                    ((histBottom-paddingTop) - yScale(getY(d, "mutation")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "multiple")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "cnaLoss")))
	                )
	                + paddingTop;
	        })
	        .attr("width", studyWidth)
	        .attr("height", function(d, i) {
	            return (histBottom-paddingTop) - yScale(getY(d, "cnaDown"));
	        })
	        .style("stroke", "white")
	        .style("stroke-width", "1")
	        .attr("class", function(d, i) {
	        	if (getY(d, "cnaDown") > 0) {isThereDeletion = true}
	        	return d.typeOfCancer + " alt-cnadown";
	        })
	    ;
	
	    var cnaupBarGroup = histogram.append("g");
	    histogram._xGroups.push(cnaupBarGroup);
	    cnaupBarGroup.selectAll("rect")
	        .data(histData, key)
	        .enter()
	        .append("rect")
	        .attr("fill", "red")
	        .attr("x", function(d, i) { return paddingLeft + i * studyLocIncrements; } )
	        .attr("y", function(d, i) {
	            return yScale(getY(d, "cnaUp"))
	                - (
	                    ((histBottom-paddingTop) - yScale(getY(d, "mutation")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "multiple")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "cnaLoss")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "cnaDown")))
	                )
	                + paddingTop;
	        })
	        .attr("width", studyWidth)
	        .attr("height", function(d, i) {
	            return (histBottom-paddingTop) - yScale(getY(d, "cnaUp"));
	        })
	        .style("stroke", "white")
	        .style("stroke-width", "1")
	        .attr("class", function(d, i) { 
	        	if (getY(d, "cnaUp") > 0) {isThereAmplification = true}
	        	return d.typeOfCancer + " alt-cnaup";
	        	})
	    ;
	
	    var cnagainBarGroup = histogram.append("g");
	    histogram._xGroups.push(cnagainBarGroup);
	    cnagainBarGroup.selectAll("rect")
	        .data(histData, key)
	        .enter()
	        .append("rect")
	        .attr("fill", "lightpink")
	        .attr("x", function(d, i) { return paddingLeft + i * studyLocIncrements; } )
	        .attr("y", function(d, i) {
	            return yScale(getY(d, "cnaGain"))
	                - (
	                ((histBottom-paddingTop) - yScale(getY(d, "mutation")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "multiple")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "cnaLoss")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "cnaDown")))
	                    + ((histBottom-paddingTop) - yScale(getY(d, "cnaUp")))
	                )
	                + paddingTop;
	        })
	        .attr("width", studyWidth)
	        .attr("height", function(d, i) {
	            return (histBottom-paddingTop) - yScale(getY(d, "cnaGain"));
	        })
	        .style("stroke", "white")
	        .style("stroke-width", "1")
	        .attr("class", function(d, i) { 
	        	if (getY(d, "cnaGain") > 0) {isThereGain = true}
	        	return d.typeOfCancer + " alt-cnagain";
	        	})
	    ;
	
	    //"invisible" div on top of bars to enable tooltip:
	    var infoBarGroup = histogram.append("g");
	    histogram._xGroups.push(infoBarGroup);
	    infoBarGroup.selectAll("rect")
	        .data(histData, key)
	        .enter()
	        .append("rect")
	        .attr("fill", "#aaaaaa")
	        .attr("x", function(d, i) { return paddingLeft + i * studyLocIncrements; } )
	        .attr("y", function(d, i) { return yScale(getY(d, "all")) + paddingTop; })
	        .attr("width", studyWidth)
	        .attr("height", function(d, i) {
	            return (histBottom-paddingTop) - yScale(getY(d, "all"));
	        })
	        .style("opacity", model.get("showGenomicAlterationTypes") ? 0 : 1) //make visible depending on showGenomicAlterationTypes
	        .style("stroke", "white")
	        .style("cursor", "pointer")
	        .style("stroke-width", "1")
	        .attr("class", function(d, i) { return d.typeOfCancer + " alt-info" })
	        .each(function(d, i)  {
	        	//add tooltip:
                var container = $("<div></div>");
                (new StudyToolTipView({
                    el: container,
                    model: {
                        dataItem: d
                    }
                })).render();

                var qOpts = _.extend(defaultQTipOptions, {
                    content: container.html()
                });
                $(this).qtip(qOpts);
                
            });

	
	    //X axis labels:
	    var abbrGroups = histogram.append("g");
	    histogram._xGroups.push(abbrGroups);
	    abbrGroups.selectAll("text")
	        .data(histData, key)
	        .enter()
	        .append("text")
	        .text(function(d, i) {
	            return getTypeOfCancer(d);
	        })
	        .attr("font-family", fontFamily)
	        .attr("font-size", function() { return Math.min((studyWidth * .65), 12) + "px"; })
	        .attr("x", function(d, i) { return paddingLeft + i*studyLocIncrements + studyWidth*.5; })
	        .attr("y", function() { return histBottom + 10; })
	        .attr("text-anchor", "end")
	        .attr("transform", function(d, i) {
	            var xLoc = paddingLeft + i*studyLocIncrements + studyWidth*.5;
	            var yLoc = histBottom + 10;
	            return "rotate(-60, " + xLoc + ", " + yLoc +  ")";
	        })
	    ;
	    
	    var yAxisEl = histogram.append("g")
	        .attr("class", "axis")
	        .attr("transform", "translate(" + (paddingLeft-10) + ", " + paddingTop + ")")
	        .call(yAxis);
	    // Give some style
	    yAxisEl.selectAll("path, line")
	        .attr("fill", "none")
	        .attr("stroke", "black")
	        .attr("shape-rendering", "crispEdges");
	
	    // d3 formating 
	    yAxisEl.selectAll("text")
	        .attr("font-family", fontFamily)
	        .attr("font-size", "11px")
	        .each(function(d) {
	            $(this).text(getYlabel(d) );
	        });		    
	    
	    
	    // Add dataTypeYAxis label information to Y axis
	    var labelCorX = 15;
	    var labelCorY = paddingTop + (histBottom/2);
	    histogram.append("g")
	        .selectAll("text")
	        .data([model.get("dataTypeYAxis")])
	        .enter()
	        .append("text")
	        .text(function(d, i) { return d; })
	        .attr("font-family", fontFamily)
	        .attr("font-size", "13px")
	        .attr("x", labelCorX)
	        .attr("y", labelCorY)
	        .attr("transform", "rotate(-90, " + labelCorX + ", " + labelCorY +")")
	    ;
	
	    var mutLegend = { label: "Mutation", color: "green"};
	    var lossLegend = { label: "Het. Loss", color: "skyblue"};
	    var delLegend = { label: "Deletion", color: "blue"};
	    var gainLegend = { label: "Gain", color: "lightpink"};
	    var ampLegend = { label: "Amplification", color: "red"};
	    var multpLegend = { label: "Multiple alterations", color: "#aaaaaa" };
	
	    var legendData = [];
	    if(isThereMutation) {legendData.push(mutLegend); }
	    if(isThereHetLoss) {legendData.push(lossLegend); }
	    if(isThereDeletion) {legendData.push(delLegend); }
	    if(isThereGain) {legendData.push(gainLegend); }
	    if(isThereAmplification) {legendData.push(ampLegend); }
	    if(isThereMultiple) {legendData.push(multpLegend); }
	
	    if (legendData.length > 0) {
	    	
		    var legendWidth = 125;
		    var numOfLegends = legendData.length;
		    var legBegPoint = (width-paddingLeft-paddingRight-(numOfLegends*legendWidth))/2;
		    // Now add the legends
		    var legend = histogram.append("g");
		    legend.selectAll("rect")
		        .data(legendData)
		        .enter()
		        .append("rect")
		        .attr('x', function(d, i) { return legBegPoint + i*legendWidth + 10; })
		        .attr('y', height-20)
		        .attr('width', 19)
		        .attr('height', 19)
		        .style('fill', function(d) { return d.color; })
		        .style("opacity", model.get("showGenomicAlterationTypes") ? 1 : 0) //make visible depending on showGenomicAlterationTypes
		    ;
		    legend.selectAll("text")
		        .data(legendData)
		        .enter()
		        .append("text")
		        .attr('x', function(d, i) { return legBegPoint + i*legendWidth + 35; })
		        .attr('y', height-5)
		        .text(function(d, i) { return d.label; })
		        .attr("font-family", fontFamily)
		        .attr("font-size", "15px")
		        .style("opacity", model.get("showGenomicAlterationTypes") ? 1 : 0) //make visible depending on showGenomicAlterationTypes
		    ;
	    }
	    else {
	    	//no data:
	    	var noData = histogram.append("g");
	    	noData
	        .append("text")
	        .attr("x", (width-paddingLeft-paddingRight)/3)
	        .attr("y", labelCorY)
	        .text("No alteration data to plot")
	        .attr("font-family", fontFamily)
	        .attr("font-size", "15px")
	        .style("opacity", 0.5) 
	    ;
	    	
	    }
	    	
	    
	    
	    
	    
	    return histogram;
	};
	    
    
	
    var sortItems = function (histData, model, histogram) {
    	
    	
    	var sortFunction = function (a, b) {
        	if (model.get("sortXAxis") == "Y-Axis Values") 
        		return getYValue(b, "all", model.get("dataTypeYAxis")) - getYValue(a, "all", model.get("dataTypeYAxis"));
        	else
        		return a.typeOfCancer > b.typeOfCancer;
        };

		//there will only be a transition animation if at this point the order of histData is different from the order in which the diagrams are drawn. 
    	//That is why here we sort the data: 
        histData.sort(sortFunction);

    	if (histogram) {
    		//sort also histogram:
	        var key = function(d) {
		        return d.typeOfCancer;
		    };
		    
		    var studyWidth = getStudyWidth(histData);
		    var studyLocIncrements = studyWidth / .75;
		    
		    //Sort the histogram, with animation transitions on X axis:
		    for (var i =0; i < histogram._xGroups.length; i++){
		    	var xGroup = histogram._xGroups[i];
		    	xGroup.selectAll("rect") 
	        	.data(histData, key)    
	            .sort(sortFunction)
	            .transition()
	            .duration(animationDuration)
	            .attr("x", function (d, i) {
	            	return paddingLeft + i * studyLocIncrements; 
	            });
		    	
		    	xGroup.selectAll("text")  
	        	.data(histData, key)
	            .sort(sortFunction)
	            .transition()
	            .duration(animationDuration)
	            .attr("x", function(d, i) { return paddingLeft + i*studyLocIncrements + studyWidth*.5; })
	            .attr("transform", function(d, i) {
			            var xLoc = paddingLeft + i*studyLocIncrements + studyWidth*.75;
			            var yLoc = histBottom + 10;
			            return "rotate(-60, " + xLoc + ", " + yLoc +  ")";
			        });
		    }
    	}
        
    };    
	
	
	var StudyToolTipView = Backbone.View.extend({
        template: _.template($("#cancer-type-tip-tmpl").html()),
        render: function() {
            var dataItem = this.model.dataItem;

            var fixFloat = function(number, digit) {
                var multiplier = Math.pow( 10, digit );
                return Math.round( number * multiplier ) / multiplier;
            };
            
            var summary = {
                name: dataItem.typeOfCancer,
                caseSetLength: dataItem.caseSetLength,
                // frequencies
                allFrequency: fixFloat(calculateFrequency(dataItem, "all") * 100, 1),
                mutationFrequency: fixFloat(calculateFrequency(dataItem, "mutation")  * 100, 1),
                deletionFrequency: fixFloat(calculateFrequency(dataItem, "cnaDown") * 100, 1),
                amplificationFrequency: fixFloat(calculateFrequency(dataItem, "cnaUp") * 100, 1),
                lossFrequency: fixFloat(calculateFrequency(dataItem, "cnaLoss") * 100, 1),
                gainFrequency: fixFloat(calculateFrequency(dataItem, "cnaGain") * 100, 1),
                multipleFrequency: fixFloat(calculateFrequency(dataItem, "multiple") * 100, 1),
                // raw counts
                allCount: dataItem.alterations.all,
                mutationCount: dataItem.alterations.mutation,
                deletionCount: dataItem.alterations.cnaDown,
                amplificationCount: dataItem.alterations.cnaUp,
                gainCount: dataItem.alterations.cnaGain,
                lossCount: dataItem.alterations.cnaLoss,
                multipleCount: dataItem.alterations.multiple //,
                // and create the link
                //studyLink: _.template($("#study-link-tmpl").html(), { study: study, genes: genes } )
            };

            this.$el.html(this.template(summary));
            this.$el.find("table.cc-tip-table tr.cc-hide").remove();
            this.$el.find("table.cc-tip-table").dataTable({
                "sDom": 't',
                "bJQueryUI": true,
                "bDestroy": true,
                "aaSorting": [[ 1, "desc" ]],  //TODO - sorting on text....should sort numerically
                "aoColumns": [
                    { "bSortable": false },
                    { "bSortable": false }
                ]
            });

            // TODO this is a workaround to remove the sort icons,
            // we should fix this through the data tables API
            this.$el.find("span.DataTables_sort_icon").remove();
            this.$el.find("table.cc-tip-table th").removeClass("sorting_desc");

            return this;
        }
    });
	
	
}




//'presenter' layer to expose the parameters from query, formating its data for display in the views
function HistogramPresenter(model, dmPresenter, geneId)
{
	this.model = model;
	this.dmPresenter = dmPresenter;
	this.histData = null;
	this.geneId = geneId;
	// this method will retrieve the data for the histogram according to the 
	// settings found in the model and format this into the correct JSON format
	// to be used in the D3JS functions to draw the histogram:
	this.getJSONDataForHistogram = function(callBackFunction){

		//call the "data manager" layer to retrieve the data and transform to correct JSON structure
		this.histData = this.getHistogramData();		
		
		var finalHistData = [];
		//filter data on nr of samples:
		var minNrAlteredSamples = model.get("minNrAlteredSamples");
		
		for (var i = 0; i < this.histData.length; i++) {
			if (this.histData[i].alterations.all >= minNrAlteredSamples)
				finalHistData.push(this.histData[i]);
		}
		
		this.histData = finalHistData;
		callBackFunction(this.histData);
	}
	
	this.getHistogramData = function() {
		//returns list of objects with following structure:
		//   {
		//	      "typeOfCancer": "cancer_type1",
		//	      "caseSetLength": 806,
		//	      "alterations": {
		//	         "all": 136,
		//	         "mutation": 50,
		//	         "cnaUp": 70,
		//	         "cnaDown": 16,
		//	         "cnaLoss": 0,
		//	         "cnaGain": 0,
		//	         "multiple": 0
		//	      }
		//	  }
		var result = [];
		var caseSetLength = this.dmPresenter.getCaseSetLength(); 
		//get the selected items from the model:
		var cancerTypes = this.model.get("cancerTypeDetailed");//when this.model.get("cancerType") == "All" then "cancerTypeDetailed" contains the list of main cancer types (see SpecificCancerTypesView render() function) 
		for (var i = 0; i < cancerTypes.length; i++) {
			var resultItem = {
					typeOfCancer: cancerTypes[i],
					caseSetLength: caseSetLength,
					alterations: (function (cancerType, dmPresenter, geneId) {
						if (cancerType == "All")
							return dmPresenter.getAlterationEvents(cancerTypes[i], null, geneId);
						else
							return dmPresenter.getAlterationEvents(cancerType, cancerTypes[i], geneId);
					})(this.model.get("cancerType"), this.dmPresenter, this.geneId)
				};
			result.push(resultItem);
		}
		
		return result;
	}

}

