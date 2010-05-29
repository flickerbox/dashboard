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
	assigned: function() {
		$.getJSON("/api/bugs/assigned",
		function(data) {
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
	historicalAverage: function() {
		$.getJSON("/api/bugs/historical_average",
		function(data) {
			var days_open = new RGraph.Line('days-open', data);
			days_open.Set('chart.gutter', 30);
			days_open.Set('chart.hmargin', 10);
			days_open.Set('chart.linewidth', 7);

			days_open.Set('chart.colors',  ['#b1e4ff']);
			days_open.Set('chart.text.color', '#0a0a0a');
			days_open.Set('chart.xticks', null);
			days_open.Set('chart.background.grid', false);
			days_open.Set('chart.axis.color', '#0a0a0a');
			days_open.Set('chart.filled', true);
			days_open.Set('chart.fillstyle', '#1a9be5');

			days_open.Draw();
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