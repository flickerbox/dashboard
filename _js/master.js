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
	historicalAverage: function() {
		$.getJSON("/api/bugs/historical_average",
		function(points) {
			var canvas = document.getElementById('days-open');
			var ctx = canvas.getContext('2d');
			var totalWidth = $('#days-open').width();
			
			var width = totalWidth / (points.length - 1);
			var height = $('#days-open').height();
			
			ctx.clearRect(0, 0, totalWidth, height + 1);
			
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
			var yPosition = [];
			for (var i=0; i < percent.length; i++) {
				yPosition[i] =  percent[i] / max;
				yPosition[i] = Math.round(yPosition[i] * height)
				yPosition[i] = height - yPosition[i] + 20;
			};

			// Fill
			ctx.beginPath();  
			ctx.moveTo(0,yPosition[0]);
			for (var i=1; i < yPosition.length; i++) {
				ctx.lineTo(width*i,yPosition[i]);

			};
			ctx.lineTo(totalWidth + 1,height);  
			ctx.lineTo(0,height); 
			ctx.fillStyle = "#1a9be5"; 
			ctx.fill();

			// Stroke
			ctx.beginPath();  
			ctx.moveTo(0,yPosition[0]);
			for (var i=1; i < yPosition.length; i++) {
				ctx.lineTo(width*i,yPosition[i]);
			};
			ctx.strokeStyle = "#FFFFFF"; 
			ctx.lineWidth = 6; 
			ctx.stroke();
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
