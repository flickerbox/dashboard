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
	lineChart: function (){
		// get the canvas element using the DOM
		var canvas = document.getElementById('days-open');
		var ctx = canvas.getContext('2d');
		var points = [35,33,32,33,34,29,31,31,34,34,37,39,40,40,37,38,37,34,34,32,30,32,32,36,37,36,34,34,35,35];
		var width = 28.79;
		
		var height = 450;
		
		var total = 0;
		for (var i=0; i < points.length; i++) {
			total += points[i];
		};
		
		var percent = [];
		for (var i=0; i < points.length; i++) {
			percent[i] = points[i] / total;
			percent[i] = percent[i] * 100
		};
		
		var max = Math.max.apply(Math, percent);
		
		var relative_percent = [];
		for (var i=0; i < percent.length; i++) {
			relative_percent[i] =  percent[i] / max;
			relative_percent[i] = Math.round(relative_percent[i] * height)
			relative_percent[i] = height - relative_percent[i];
		};
				
		console.log(relative_percent);
		
		// Filled triangle
		ctx.beginPath();  

		ctx.moveTo(0,relative_percent[0]);
		
		for (var i=1; i < relative_percent.length; i++) {
			ctx.lineTo(width*i,relative_percent[i]);
			
		};
		
		ctx.lineTo(835,height);  
		ctx.lineTo(0,height); 
		ctx.fillStyle = "#1a9be5"; 
		ctx.fill();
			

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
	// historicalAverage: function() {
	// 	$.getJSON("/api/bugs/historical_average",
	// 	function(data) {
	// 		var days_open = new RGraph.Line('days-open', data);
	// 		days_open.Set('chart.gutter', 30);
	// 		days_open.Set('chart.hmargin', 10);
	// 		days_open.Set('chart.linewidth', 7);
	// 
	// 		days_open.Set('chart.colors',  ['#b1e4ff']);
	// 		days_open.Set('chart.text.color', '#0a0a0a');
	// 		days_open.Set('chart.xticks', null);
	// 		days_open.Set('chart.background.grid', false);
	// 		days_open.Set('chart.axis.color', '#0a0a0a');
	// 		days_open.Set('chart.filled', true);
	// 		days_open.Set('chart.fillstyle', '#1a9be5');
	// 
	// 		days_open.Draw();
	// 	});
	// },
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