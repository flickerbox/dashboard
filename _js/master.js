var graph = {
	strokeOpen: '#F30',
	strokeClosed: '#45b63f',
	fillOpen: '#52d94b',
	fillClosed: '#c15f4f',
	context: null,
	width: null,
	height: null,
	drawGraph: function(counts) {
		var canvas = document.getElementById('days-open');
		graph.context = canvas.getContext('2d');
		graph.width = canvas.width;
		graph.height = canvas.height;
				
		var data = graph.sumData(counts);
		var tetragons = graph.buildTetragons(data);
				
		tetragons.map(graph.drawTetragon);
		graph.drawLine(data.open, graph.strokeOpen);
		graph.drawLine(data.closed, graph.strokeClosed);
	},
	drawTetragon: function(tetragon) {
		graph.context.beginPath();  
		graph.context.lineWidth = 0; 
		graph.context.fillStyle = tetragon.color; 
				
		graph.context.moveTo(tetragon.a[0], tetragon.a[1]);
		graph.context.lineTo(tetragon.b[0], tetragon.b[1]);
		graph.context.lineTo(tetragon.c[0], tetragon.c[1]);
		graph.context.lineTo(tetragon.d[0], tetragon.d[1]);
					
		graph.context.closePath();
		graph.context.fill();
	},
	buildTetragons: function(data) {
		var xWidth = graph.width / (data.open.length - 1);
		var tetragons = []
		var color = graph.fillClosed; 
		var color1 = graph.fillClosed; 
		var color2 = graph.fillClosed; 
				
		for (var i=0; i < data.open.length; i++) {
			var x1 = xWidth * i;
			var x2 = xWidth * (i + 1);
					
			var y1_open = data.open[i];
			var y2_open = data.open[i + 1];
					
			var y1_closed = data.closed[i];
			var y2_closed = data.closed[i + 1];
					
			var intersection = graph.intersectionFromPoints(x1, x2, y1_open, y2_open, y1_closed, y2_closed);

			color1 = (y1_open > y1_closed) ? graph.fillOpen : graph.fillClosed; 
			color2 = (y2_closed > y2_open) ? graph.fillClosed : graph.fillOpen;

			if (graph.linesCross(intersection[0], x1, x2)) {
				tetragons.push({ color: color1, a: [x1, y1_open], b: intersection, c: intersection, d: [x1, y1_closed] });
				tetragons.push({ color: color2, a: intersection, b: [x2, y2_open], c: [x2, y2_closed], d: intersection });
			}
			else {
				tetragons.push({ color: color2, a: [x1, y1_open], b: [x2, y2_open], c: [x2, y2_closed], d: [x1, y1_closed] });
			}
		};
				
		return tetragons;
	},
	drawLine: function (data, color) {
		var xWidth = graph.width / (data.length - 1);
		graph.context.beginPath();  
		graph.context.moveTo(0,data[0]);
		for (var i=1; i < data.length; i++) {
			graph.context.lineTo(xWidth*i, data[i]);
		};
		graph.context.strokeStyle = color; 
		graph.context.lineWidth = 4; 
		graph.context.stroke();
	},
	sumData: function (data) {
		var open = [];
		var closed = [];
		var all = [];
		var openTotal = 0;
		var closedTotal = 0;
		for (var i=0; i < data.length; i++) {
			openTotal += data[i].open
			closedTotal += data[i].closed
			open.push(openTotal)
			closed.push(closedTotal)
			all.push(openTotal)
			all.push(closedTotal)
		}
				
		return {open: graph.percent(open, all), closed: graph.percent(closed, all)};
	},
	percent: function(data, all) {
		var max = Math.max.apply(Math, all);
		for (var i=0; i < data.length; i++) {
			data[i] = data[i] / max;
			data[i] = graph.height - Math.round(data[i] * graph.height);
		};
		return data;
	},
	linesCross: function(x, x1, x2) {
		return (x >= x1 && x < x2);
	},
	intersectionFromPoints: function(x1, x2, y1_open, y2_open, y1_closed, y2_closed) {
		var openM = graph.slope(x1, x2, y1_open, y2_open);
		var closedM = graph.slope(x1, x2, y1_closed, y2_closed);

		var openB = graph.yIntercept(y1_open,openM,x1);
		var closedB = graph.yIntercept(y1_closed,closedM,x1);
					
		return graph.intersection(openM,closedM,openB,closedB);
	},
	slope: function(x1,x2,y1,y2) {
		var y = (y2 - y1);
		var x = (x2 - x1);
		return y / x;
	},
	yIntercept: function(y,m,x) {
		return y - (m * x);
	},
	intersection: function(m1,m2,b1,b2) {
		var x = (b2 - b1) / (m1 - m2);
		var y = m1 * x + b1;
		return [x, y];
	}
}

Core = {
	timeoutBar: function() {
		if ($('.timeout-bar').hasClass("animate")) {
			$('.timeout-bar').removeClass('animate');
		}
		else {
			$('.timeout-bar').addClass('animate');
		}
	}
};

Core.Bugs = {
	// historicalAverage: function() {
	// 	$.getJSON("/api/bugs/historical_average",
	// 	function(points) {
	// 		var canvas = document.getElementById('days-open');
	// 		var ctx = canvas.getContext('2d');
	// 		var totalWidth = $('#days-open').width();
	// 		
	// 		var width = totalWidth / (points.length - 1);
	// 		var height = $('#days-open').height();
	// 		
	// 		ctx.clearRect(0, 0, totalWidth, height + 1);
	// 		
	// 		var total = 0;
	// 		for (var i=0; i < points.length; i++) {
	// 			total += points[i];
	// 		};
	// 		var percent = [];
	// 		for (var i=0; i < points.length; i++) {
	// 			percent[i] = points[i] / total;
	// 			percent[i] = percent[i] * 100
	// 		};
	// 
	// 		var max = Math.max.apply(Math, percent);
	// 		var yPosition = [];
	// 		for (var i=0; i < percent.length; i++) {
	// 			yPosition[i] =  percent[i] / max;
	// 			yPosition[i] = Math.round(yPosition[i] * height)
	// 			yPosition[i] = height - yPosition[i] + 20;
	// 		};
	// 
	// 		// Fill
	// 		ctx.beginPath();  
	// 		ctx.moveTo(0,yPosition[0]);
	// 		for (var i=1; i < yPosition.length; i++) {
	// 			ctx.lineTo(width*i,yPosition[i]);
	// 
	// 		};
	// 		ctx.lineTo(totalWidth + 1,height);  
	// 		ctx.lineTo(0,height); 
	// 		ctx.fillStyle = "#1a9be5"; 
	// 		ctx.fill();
	// 
	// 		// Stroke
	// 		ctx.beginPath();  
	// 		ctx.moveTo(0,yPosition[0]);
	// 		for (var i=1; i < yPosition.length; i++) {
	// 			ctx.lineTo(width*i,yPosition[i]);
	// 		};
	// 		ctx.strokeStyle = "#FFFFFF"; 
	// 		ctx.lineWidth = 6; 
	// 		ctx.stroke();
	// 	});
	// },
	differenceGraph: function() {
		$.getJSON("/api/bugs/open_close", function(counts) {
			graph.drawGraph(counts);
		});
	},
	assigned: function() {
		var template = '<li style="width: %WIDTH%px">\
			<a href="#">\
				<span class="label large">%NAME%</span>\
				<span class="count %NAME%"><span class="number number-%NAME%"></span></span>\
			</a>\
		</li>';
		$.getJSON("/api/bugs/assigned",
		function(data) {
			// Create the list items if there are none
			if ($('.barchart').children().length == 0) {
				
				var barCount = 0;
				$.each(data.relative_percent, function(i,item) {
					barCount++;
				});
				
				var totalWidth     = $('.barchart').width();
				var spaceAvailable = totalWidth - (20 * (barCount - 1));
				var barWidth       = Math.floor(spaceAvailable / barCount);
				
				$.each(data.relative_percent, function(i,item) {
					$('.barchart').append(template.replace(/%WIDTH%/g,barWidth).replace(/%NAME%/g,i));
				});
			};
			$.each(data.relative_percent, function(i,item) {
				item = item + 20;
				$('.barchart .' + i).css({"height": item + "%"});
			});
			$.each(data.bugs_assigned, function(i,item) {
				$(".number-" + i).html(item);
			});
		});
	},
	theCloser: function() {
		$.getJSON("/api/bugs/the_closer",
		function(data) {
			if (data != "FALSE") {
				$('.closer-image').html('<img src="http://www.gravatar.com/avatar/' + data[0].email_md5 + '?s=75" />');
				$('.closer-count').html(data[0].closed + ' bugs');
				$('.closer-name').html(data[0].username);
			}
		});
	},
	theOpener: function() {
		$.getJSON("/api/bugs/the_opener",
		function(data) {
			if (data != "FALSE") {
				$('.opener-image').html('<img src="http://www.gravatar.com/avatar/' + data[0].email_md5 + '?s=75" />');
				$('.opener-count').html(data[0].opened + ' bugs');
				$('.opener-name').html(data[0].username);
			}
		});
	},
	average: function() {
		$.getJSON("/api/bugs/average",
		function(data) {
			$(".average-days").html(data.days);
		});
	},
	oldest: function() {
		$.getJSON("/api/bugs/oldest",
		function(data) {
			$.each(data, function(i,item) {
				$('.bug-list li:eq(' + i + ') .owner').html('<img src="http://www.gravatar.com/avatar/' + item.email_md5 + '?s=75" />');
				$('.bug-list li:eq(' + i + ') .bug-id').html(item.id);
				$('.bug-list li:eq(' + i + ') .bug-age').html(item.days + ' Days');
			});
		});
	},
	priority: function() {
		$.getJSON("/api/bugs/priority",
		function(data) {
			
			if (data > 0) {
				$(".priority-bugs").html(data);
				$(".priority-wrap").show("fast");
			}
			else {
				$(".priority-wrap").hide("fast");
			}
		});
	}
};

function theExecutor () {
	Core.timeoutBar();
	$.each(Core.Bugs, function(i,item) {
		item();
	});
}

$(document).ready(function() {
		theExecutor();
		window.setInterval('theExecutor()', 30000);
});
