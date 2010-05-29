/**
* o------------------------------------------------------------------------------o
* | This file is part of the RGraph package - you can learn more at:             |
* |                                                                              |
* |                          http://www.rgraph.net                               |
* |                                                                              |
* | This package is licensed under the RGraph license. For all kinds of business |
* | purposes there is a small one-time licensing fee to pay and for non          |
* | commercial  purposes it is free to use. You can read the full license here:  |
* |                                                                              |
* |                      http://www.rgraph.net/LICENSE.txt                       |
* o------------------------------------------------------------------------------o
*/

/**
* Initialise the various objects
*/
if (typeof(RGraph) == 'undefined') RGraph = {};


RGraph.Registry       = {};
RGraph.Registry.store = []
RGraph.background     = {};
RGraph.objects        = [];


/**
* Returns five values which are used as a nice scale
* 
* @param  max int The maximum value of the graph
* @return     int The highest value in the scale
*/
RGraph.getScale = function (max)
{
    /**
    * Special case for 0
    */
    if (max == 0) {
        return ['0.2', '0.4', '0.6', '0.8', '1.0'];
    }

    var original_max = max;

    /**
    * Manually do decimals
    */
    if (max <= 1) {
        if (max > 0.5) {
            return [0.2,0.4,0.6,0.8, Number(1).toFixed(1)];

        } else if (max >= 0.1) {
            return [0.1,0.2,0.3,0.4,0.5];

        } else {

            var tmp = max;
            var exp = 0;

            while (tmp < 1.01) {
                exp += 1;
                tmp *= 10;
            }

            var ret = ['2e-' + exp, '4e-' + exp, '6e-' + exp, '8e-' + exp, '10e-' + exp];


            if (max <= ('5e-' + exp)) {
                ret = ['1e-' + exp, '2e-' + exp, '3e-' + exp, '4e-' + exp, '5e-' + exp];
            }

            return ret;
        }
    }

    // Take off any decimals
    if (String(max).indexOf('.') > 0) {
        max = String(max).replace(/\.\d+$/, '');
    }

    var interval = Math.pow(10, Number(String(Number(max)).length - 1));
    var topValue = interval;

    while (topValue < max) {
        topValue += (interval / 2);
    }

    // Handles cases where the max is (for example) 50.5
    if (Number(original_max) > Number(topValue)) {
        topValue += (interval / 2);
    }

    // Custom if the max is greater than 5 and less than 10
    if (max < 10) {
        topValue = (Number(original_max) <= 5 ? 5 : 10);
    }

    return [topValue * (1/5), topValue * (2/5), topValue * (3/5), topValue * (4/5), topValue];
}


/**
* Returns the maximum value which is in an array
* 
* @param  array arr The array
* @param  int       Whether to ignore signs (ie negative/positive)
* @return int       The maximum value in the array
*/
RGraph.array_max = function (arr)
{
    var max = null;
    
    for (var i=0; i<arr.length; ++i) {
        max = (max ? Math.max(max, arguments[1] ? Math.abs(arr[i]) : arr[i]) : arr[i]);
    }
    
    return max;
}


/**
* An array sum function
* 
* @param  array arr The  array to calculate the total of
* @return int       The summed total of the arrays elements
*/
RGraph.array_sum = function (arr)
{
    // Allow integers
    if (typeof(arr) == 'number') {
        return arr;
    }

    var i, sum;
    var len = arr.length;

    for(i=0,sum=0;i<len;sum+=arr[i++]);
    return sum;
}


/**
* Converts degrees to radians
* 
* @param  int degrees The number of degrees
* @return float       The number of radians
*/
RGraph.degrees2Radians = function (degrees)
{
    return degrees * (Math.PI / 180);
}


/**
* This function draws an angled line. The angle is cosidered to be clockwise
* 
* @param obj ctxt   The context object
* @param int x      The X position
* @param int y      The Y position
* @param int angle  The angle in RADIANS
* @param int length The length of the line
*/
RGraph.lineByAngle = function (context, x, y, angle, length)
{
    context.arc(x, y, length, angle, angle, false);
    context.lineTo(x, y);
    context.arc(x, y, length, angle, angle, false);
}


/**
* This is a useful function which is basically a shortcut for drawing left, right, top and bottom alligned text.
* 
* @param object context The context
* @param string font    The font
* @param int    size    The size of the text
* @param int    x       The X coordinate
* @param int    y       The Y coordinate
* @param string text    The text to draw
* @parm  string         The vertical alignment. Can be null. "center" gives center aligned  text, "top" gives top aligned text.
*                       Anything else produces bottom aligned text. Default is bottom.
* @param  string        The horizontal alignment. Can be null. "center" gives center aligned  text, "right" gives right aligned text.
*                       Anything else produces left aligned text. Default is left.
* @param  bool          Whether to show a bounding box around the text. Defaults not to
* @param int            The angle that the text should be rotate at (IN DEGREES)
* @param string         Background color for the text
* @param bool           Whether the text is bold or not
*/
RGraph.Text = function (context, font, size, x, y, text)
{
    // Accommodate MSIE
    if (document.all) {
        y += 2;
    }

    context.font = (arguments[11] ? 'Bold ': '') + size + 'pt ' + font;
    var i;
    var origX = x;
    var origY = y;
    var originalFillStyle = context.fillStyle;

    // Need these now the angle can be specified, ie defaults for the former two args
    if (typeof(arguments[6]) == null) arguments[6] = 'bottom'; // Vertical alignment. Default to bottom/baseline
    if (typeof(arguments[7]) == null) arguments[7] = 'left';   // Horizontal alignment. Default to left
    if (typeof(arguments[8]) == null) arguments[8] = null;     // Show a bounding box. Useful for positioning during development. Defaults to false
    if (typeof(arguments[9]) == null) arguments[9] = 0;        // Angle (IN DEGREES) that the text should be drawn at. 0 is middle right, and it goes clockwise

    // The alignment is recorded here for purposes of Opera compatibility
    if (navigator.userAgent.indexOf('Opera') != -1) {
        context.canvas.__rgraph_valign__ = arguments[6];
        context.canvas.__rgraph_halign__ = arguments[7];
    }

    // First, translate to x/y coords
    context.save();

        context.canvas.__rgraph_originalx__ = x;
        context.canvas.__rgraph_originaly__ = y;

        context.translate(x, y);
        x = 0;
        y = 0;
        
        // Rotate the canvas if need be
        if (arguments[9]) {
            context.rotate(arguments[9] / 57.3);
        }

        // Vertical alignment - defaults to bottom
        if (arguments[6]) {
            var vAlign = arguments[6];

            if (vAlign == 'center') {
                context.translate(0, size / 2);
            } else if (vAlign == 'top') {
                context.translate(0, size);
            }
        }


        // Hoeizontal alignment - defaults to left
        if (arguments[7]) {
            var hAlign = arguments[7];
            var width  = context.measureText(text).width;

            if (hAlign) {
                if (hAlign == 'center') {
                    context.translate(-1 * (width / 2), 0)
                } else if (hAlign == 'right') {
                    context.translate(-1 * width, 0)
                }
            }
        }
        
        /**
        * If requested, draw a background for the text
        */
        if (arguments[10]) {

            var offset = 3;
            var ieOffset = document.all ? 2 : 0;
            var width = context.measureText(text).width

            context.strokeStyle = 'gray';
            context.fillStyle = arguments[10];
            context.fillRect(x - offset, y - size - offset - ieOffset, width + (2 * offset), size + (2 * offset));
            context.strokeRect(x - offset, y - size - offset - ieOffset, width + (2 * offset), size + (2 * offset));
        }
        
        
        context.fillStyle = originalFillStyle;

        /**
        * Draw a bounding box if requested
        */
        context.save();
             context.fillText(text,0,0);
            
            // Draw the bounding box if need be
            if (arguments[8]) {
                var width = context.measureText(text).width;
                context.translate(x, y);
                context.strokeRect(0, 0, width, 0 - size);

                context.fillRect(
                    arguments[7] == 'left' ? 0 : (arguments[7] == 'center' ? width / 2 : width ) - 2,
                    arguments[6] == 'bottom' ? 0 : (arguments[6] == 'center' ? (0 - size) / 2 : 0 - size) - 2,
                    4,
                    4
                );

            }
        context.restore();
    context.restore();
}


/**
* Clears the canvas by setting the width. You can specify a colour if you wish.
* 
* @param object canvas The canvas to clear
*/
RGraph.Clear = function (canvas)
{
    var width = canvas.width;

    // Setting the size/width clears a canvas
    canvas.width = width;

    if (arguments[1]) {
        context = canvas.getContext('2d');
        context.beginPath();
        context.fillStyle = String(arguments[1]);
        context.fillRect(0,0,width,canvas.height);
        context.fill();
    }
    
    RGraph.ClearAnnotations(canvas.id);
}


/**
* Draws the title of the graph
* 
* @param object  canvas The canvas object
* @param string  text   The title to write
* @param integer gutter The size of the gutter
* @param integer        The center X point (optional - if not given it will be generated from the canvas width)
* @param integer        Size of the text. If not given it will be 14
*/
RGraph.DrawTitle = function (canvas, text, gutter)
{
    var obj     = canvas.__object__;
    var context = canvas.getContext('2d');
    var size    = arguments[4] ? arguments[4] : 12;
    var centerx = (arguments[3] ? arguments[3] : canvas.width / 2);
    var keypos  = obj.Get('chart.key.position');
    var vpos = gutter / 2;
    
    // Account for 3D effect by faking the key position
    if (obj.type == 'bar' && obj.Get('chart.variant') == '3d') {
        keypos = 'gutter';
    }

    context.beginPath();
    context.fillStyle = obj.Get('chart.text.color') ? obj.Get('chart.text.color') : 'black';

    /**
    * Vertically center the text if the key is not present
    */
    if (keypos && keypos != 'gutter') {
        var vCenter = 'center';

    } else if (!keypos) {
        var vCenter = 'center';

    } else {
        var vCenter = 'bottom';
    }

    // if chart.title.vpos does not equal 0.5, use that
    if (typeof(obj.Get('chart.title.vpos')) == 'number') {
        vpos = obj.Get('chart.title.vpos') * gutter;
    }
    
    // Set the colour
    if (typeof(obj.Get('chart.title.color') != null)) {
        var oldColor = context.fillStyle
        context.fillStyle = obj.Get('chart.title.color');
    }
    
    /**
    * Default font is Verdana
    */
    var font = obj.Get('chart.text.font');

    /**
    * Draw the title itself
    */
    RGraph.Text(context, font, size, centerx, vpos, text, vCenter, 'center', null, null, null, true);
    
    // Reset the fill colour
    context.fillStyle = oldColor;
}


/**
* This function returns the mouse position in relation to the canvas
* 
* @param object e The event object.
*/
RGraph.getMouseXY = function (event)
{
    var obj = (document.all ? event.srcElement : event.target);
    var e   = event;
    var x;
    var y;

    // Browser with offsetX and offsetY
    if (typeof(e.offsetX) == 'number' && typeof(e.offsetY) == 'number') {
        x = e.offsetX;
        y = e.offsetY;

    // FF and other
    } else {
        x = 0;
        y = 0;

        while (obj != document.body) {
            x += obj.offsetLeft;
            y += obj.offsetTop;

            obj = obj.offsetParent;
        }

        x = e.pageX - x;
        y = e.pageY - y;
    }

    return [x, y];
}


/**
* This function returns a two element array of the canvas x/y position in
* relation to the page
* 
* @param object canvas
*/
RGraph.getCanvasXY = function (canvas)
{
    var x   = 0;
    var y   = 0;
    var obj = canvas;

    while (obj != document.body) {
        x += obj.offsetLeft;
        y += obj.offsetTop;

        obj = obj.offsetParent;
    }
    
    return [x, y];
}


/**
* Shows a tooltip next to the mouse pointer
* 
* @param  canvas object The canvas element object
* @param  text   string The tooltip text
* @param int     x      The X position that the tooltip should appear at. Combined with the canvases offsetLeft
*                       gives the absolute X position
* @param int     y      The Y position the tooltip should appear at. Combined with the canvases offsetTop
*                       gives the absolute Y position
*/
RGraph.Tooltip = function (canvas, text, x, y)
{
    /**
    * First clear any exising timers
    */
    var timers = RGraph.Registry.Get('chart.tooltip.timers');

    if (timers && timers.length) {
        for (i=0; i<timers.length; ++i) {
            clearTimeout(timers[i]);
        }
    }
    RGraph.Registry.Set('chart.tooltip.timers', []);

    /**
    * Hide the context menu if it's currently shown
    */
    RGraph.HideContext();

    RGraph.Redraw(canvas.id);

    /**
    * Hide any currently shown tooltip
    */
    if (RGraph.Registry.Get('chart.tooltip')) {
        RGraph.Registry.Get('chart.tooltip').style.display = 'none';
        RGraph.Registry.Set('chart.tooltip', null);
    }
    
    
    /**
    * Hide any context menu thst currently being displayed
    * 
    * *** FIXME Is this an unnecessary dupe ??? ***
    */
    RGraph.HideContext();

    /**
    * You can now use id:xxx as your tooltip and RGraph will instead use the contents of xxx as the content
    */
    var result = /^id:(.*)/.exec(text);

    if (result) {
        text = document.getElementById(result[1]).innerHTML;
    }


    /**
    * Show a tool tip
    */
    var obj  = document.createElement('DIV');
    obj.className             = 'RGraph_tooltip';
    obj.style.display         = 'none';
    obj.style.position        = 'absolute';
    obj.style.left            = 0;
    obj.style.top             = 0;
    obj.style.backgroundColor = '#ffe';
    obj.style.color           = 'black';
    if (!document.all) obj.style.border = '1px solid rgba(0,0,0,0)';
    obj.style.visibility      = 'visible';
    obj.style.paddingLeft     = '3px';
    obj.style.paddingRight    = '3px';
    obj.style.fontFamily      = 'Tahoma';
    obj.style.fontSize        = '10pt';
    obj.style.zIndex          = 3;
    obj.style.borderRadius    = '5px';
    obj.style.MozBorderRadius    = '5px';
    obj.style.WebkitBorderRadius = '5px';
    obj.style.WebkitBoxShadow    = 'rgba(96,96,96,0.5) 3px 3px 3px';
    obj.style.MozBoxShadow       = 'rgba(96,96,96,0.5) 3px 3px 3px';
    obj.style.boxShadow          = 'rgba(96,96,96,0.5) 3px 3px 3px';
    obj.style.filter             = 'progid:DXImageTransform.Microsoft.Shadow(color=#666666,direction=135)';
    obj.style.opacity            = 0;
    obj.style.overflow           = 'hidden';
    obj.innerHTML                = text;
    obj.__text__                 = text; // This is set because the innerHTML can change when it's set
    obj.style.display            = 'inline';
    document.body.appendChild(obj);
    
    var width  = obj.offsetWidth;
    var height = obj.offsetHeight;

    /**
    * Set the width on the tooltip so it doesn't resize if the window is resized
    */
    obj.style.width = width + 'px';
    //obj.style.height = 0; // Initially set the tooltip height to nothing

    /**
    * If the mouse is towards the right of the browser window and the tooltip would go outside of the window,
    * move it left
    */
    if ( (x + width) > document.body.offsetWidth ) {
        x             = x - width - 7;
        y             = y;
        var placementLeft = true;

        obj.style.left    = x + 'px';
        obj.style.top     = y + 'px';

    } else {
        x += 5;

        obj.style.left = x + 'px';
        obj.style.top = (y - height) + 'px';
    }

    /**
    * 5/10 whole frames of animation prodicing a fade/slide in effect
    */
    var effect = canvas.__object__.Get('chart.tooltip.effect');
    if (effect == 'expand') {

        obj.style.left               = (x + (width / 2)) + 'px';
        obj.style.top                = (y - (height / 2)) + 'px';
        leftDelta                    = (width / 2) / 10;
        topDelta                     = (height / 2) / 10;

        obj.style.width              = 0;
        obj.style.height             = 0;
        obj.style.boxShadow          = '';
        obj.style.MozBoxShadow       = '';
        obj.style.WebkitBoxShadow    = '';
        obj.style.borderRadius       = 0;
        obj.style.MozBorderRadius    = 0;
        obj.style.WebkitBorderRadius = 0;
        obj.style.opacity = 1;

        // Progressively move the tooltip to where it should be (the x position)
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 25));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 50));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 75));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 100));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 125));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 150));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 175));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 200));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 225));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.left = (parseInt(RGraph.Registry.Get('chart.tooltip').style.left) - leftDelta) + 'px' }", 250));
        
        // Progressively move the tooltip to where it should be (the Y position)
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 25));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 50));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 75));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 100));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 125));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 150));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 175));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 200));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 225));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.top = (parseInt(RGraph.Registry.Get('chart.tooltip').style.top) - topDelta) + 'px' }", 250));

        // Progressively grow the tooltip width
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.1) + "px'; }", 25));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.2) + "px'; }", 50));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.3) + "px'; }", 75));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.4) + "px'; }", 100));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.5) + "px'; }", 125));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.6) + "px'; }", 150));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.7) + "px'; }", 175));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.8) + "px'; }", 200));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + (width * 0.9) + "px'; }", 225));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.width = '" + width + "px'; }", 250));

        // Progressively grow the tooltip height
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.1) + "px'; }", 25));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.2) + "px'; }", 50));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.3) + "px'; }", 75));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.4) + "px'; }", 100));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.5) + "px'; }", 125));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.6) + "px'; }", 150));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.7) + "px'; }", 175));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.8) + "px'; }", 200));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + (height * 0.9) + "px'; }", 225));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.height = '" + height + "px'; }", 250));
        
        // When the animation is finished, set the tooltip HTML
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').innerHTML = RGraph.Registry.Get('chart.tooltip').__text__; }", 250));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.boxShadow = 'rgba(96,96,96,0.5) 3px 3px 3px'; }", 250));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.MozBoxShadow = 'rgba(96,96,96,0.5) 3px 3px 3px'; }", 250));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.WebkitBoxShadow = 'rgba(96,96,96,0.5) 3px 3px 3px'; }", 250));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.borderRadius = '5px'; }", 250));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.MozBorderRadius = '5px'; }", 250));
        RGraph.Registry.Get('chart.tooltip.timers').push(setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.WebkitBorderRadius = '5px'; }", 250));

    /**
    * Fade the tooltip in
    */
    } else if (placementLeft && effect == 'fade') {
        obj.style.top = (y - height) + 'px';

    } else if (effect != 'fade' && effect != 'expand') {
        alert('[COMMON] Unknown tooltip effect: ' + effect);
    }

    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.1; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.2)'; }", 25);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.2; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.2)'; }", 50);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.3; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.2)'; }", 75);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.4; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.2)'; }", 100);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.5; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.2)'; }", 125);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.6; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.2)'; }", 150);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.7; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.4)'; }", 175);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.8; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.6)'; }", 200);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 0.9; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgba(96,96,96,0.8)'; }", 225);
    setTimeout("if (RGraph.Registry.Get('chart.tooltip')) { RGraph.Registry.Get('chart.tooltip').style.opacity = 1; RGraph.Registry.Get('chart.tooltip').style.border = '1px solid rgb(96,96,96'; }", 250);

    /**
    * Install the function for hiding the tooltip.
    */
    document.body.onmousedown = function (event)
    {
        var tooltip = RGraph.Registry.Get('chart.tooltip');

        if (tooltip) {
            tooltip.style.display = 'none';
            tooltip.style.visibility = 'hidden';
            RGraph.Registry.Set('chart.tooltip', null);

            RGraph.Redraw();
        }
    }

    //document.body.onmouseup = document.body.onmousedown;
    //document.body.onclick   = document.body.onmousedown;

    // Make all links work using the onmousedown event
    var links = obj.getElementsByTagName('a');

    for (var i=0; i<links.length; ++i) {
        links[i].onmousedown = function (event)
        {
            location.href = this.href;

            event.cancelBubble = true;
            event.stopPropagation();

            return false;
        }
    }

    /**
    * If the window is resized, hide the tooltip
    */
    window.onresize = function ()
    {
        var tooltip = RGraph.Registry.Get('chart.tooltip');

        if (tooltip) {
            tooltip.style.display = 'none';                
            tooltip.style.visibility = 'hidden';
            RGraph.Registry.Set('chart.tooltip', null);

            // Redraw the graph
            RGraph.Clear(canvas);
            canvas.__object__.Draw();
        }
    }
    
    /**
    * Keep a reference to the object
    */
    RGraph.Registry.Set('chart.tooltip', obj);

} // END TOOLTIP()


/**
* Registers a graph object (used when the canvas is redrawn)
* 
* @param object obj The object to be registered
*/
RGraph.Register = function (obj)
{
    var key = obj.id + '_' + obj.type;

    RGraph.objects[key] = obj;
}


/**
* Causes all registered objects to be redrawn
* 
* @param string   An optional string indicating which canvas is not to be redrawn
*/
RGraph.Redraw = function ()
{
    for (i in RGraph.objects) {
        if (typeof(i) == 'string' && typeof(RGraph.objects[i]) == 'object')  {
            if (!arguments[0] || arguments[0] != RGraph.objects[i].id) {
                RGraph.Clear(RGraph.objects[i].canvas);
                RGraph.objects[i].Draw();
            }
        }
    }
}


/**
* Loosly mimicks the PHP function print_r();
*/
RGraph.pr = function (obj)
{
    var str = '';
    var indent = (arguments[2] ? arguments[2] : '');

    switch (typeof(obj)) {
        case 'number':
            if (indent == '') {
                str+= 'Number: '
            }
            str += String(obj);
            break;
        
        case 'string':
            if (indent == '') {
                str+= 'String (' + obj.length + '):'
            }
            str += '"' + String(obj) + '"';
            break;

        case 'object':
            // In case of null
            if (obj == null) {
                str += 'null';
                break;
            }

            str += 'Object \n' + indent + '(\n';
            
            for (i=0; i<obj.length; ++i) {
                str += indent + '  ' + i + ' => ' + RGraph.pr(obj[i], true, indent + '\t') + '\n';
            }
            
            var str = str + indent + ')';
            break;
        
        case 'function':
            str += obj;
            break;
        
        case 'boolean':
            str += 'Boolean: ' + (obj ? 'true' : 'false');
            break;
    }

    /**
    * Finished, now either return if we're in a recursed call, or alert()
    * if we're not.
    */
    if (arguments[1]) {
        return str;
    } else {
        alert(str);
    }
}


/**
* The RGraph registry Set() function
* 
* @param  string name  The name of the key
* @param  mixed  value The value to set
* @return mixed        Returns the same value as you pass it
*/
RGraph.Registry.Set = function (name, value)
{
    // Store the setting
    RGraph.Registry.store[name] = value;
    
    // Don't really need to do this, but ho-hum
    return value;
}


/**
* The RGraph registry Get() function
* 
* @param  string name The name of the particular setting to fetch
* @return mixed       The value if exists, null otherwise
*/
RGraph.Registry.Get = function (name)
{
    //return RGraph.Registry.store[name] == null ? null : RGraph.Registry.store[name];
    return RGraph.Registry.store[name];
}


/**
* This function draws the background for the bar chart, line chart and scatter chart.
* 
* @param  object obj The graph object
*/
RGraph.background.Draw = function (obj)
{
    var canvas  = obj.canvas;
    var context = obj.context;
    var height  = 0;
    var gutter  = obj.Get('chart.gutter');
    var variant = obj.Get('chart.variant');
    
    // If it's a bar and 3D variant, translate
    if (variant == '3d') {
        context.save();
        context.translate(10, -5);
    }
    
    obj.context.beginPath();

    // Draw the horizontal bars
    context.fillStyle = obj.Get('chart.background.barcolor1');
    height = (obj.canvas.height - obj.Get('chart.gutter'));

    for (var i=gutter; i < height ; i+=80) {
        obj.context.fillRect(gutter, i, obj.canvas.width - (gutter * 2), Math.min(40, obj.canvas.height - gutter - i) );
    }

    context.fillStyle = obj.Get('chart.background.barcolor2');
    height = (obj.canvas.height - gutter);

    for (var i= (40 + gutter); i < height; i+=80) {
        obj.context.fillRect(gutter, i, obj.canvas.width - (gutter * 2), i + 40 > (obj.canvas.height - gutter) ? obj.canvas.height - (gutter + i) : 40);
    }
    
    context.stroke();

    // Draw the background grid
    if (obj.Get('chart.background.grid')) {

        context.beginPath();
        context.lineWidth = obj.Get('chart.background.grid.width') ? obj.Get('chart.background.grid.width') : 1;
        context.strokeStyle = obj.Get('chart.background.grid.color');

        // Draw the horizontal lines
        if (obj.Get('chart.background.grid.hlines')) {
            height = (canvas.height - gutter)
            for (y=gutter; y < height; y+=obj.Get('chart.background.grid.hsize')) {
                context.moveTo(gutter, y);
                context.lineTo(canvas.width - gutter, y);
            }
        }

        if (obj.Get('chart.background.grid.vlines')) {
            // Draw the vertical lines
            var width = (canvas.width - gutter)
            for (x=gutter; x<=width; x+=obj.Get('chart.background.grid.vsize')) {
                context.moveTo(x, gutter);
                context.lineTo(x, obj.canvas.height - gutter);
            }
        }

        if (obj.Get('chart.background.grid.border')) {
            // Make sure a rectangle, the same colour as the grid goes around the graph
            context.strokeStyle = obj.Get('chart.background.grid.color');
            context.strokeRect(gutter, gutter, canvas.width - (2 * gutter), canvas.height - (2 * gutter));
        }
    }
    
    context.stroke();

    // If it's a bar and 3D variant, translate
    if (variant == '3d') {
        context.restore();
    }

    // Draw the title if one is set
    if ( typeof(obj.Get('chart.title')) == 'string') {

        if (obj.type == 'gantt') {
            gutter /= 2;
        }

        RGraph.DrawTitle(canvas, obj.Get('chart.title'), gutter, null, obj.Get('chart.text.size') + 2);
    }

    context.stroke();
}


/**
* Returns the day number for a particular date. Eg 1st February would be 32
* 
* @param   object obj A date object
* @return  int        The day number of the given date
*/
RGraph.GetDays = function (obj)
{
    var year  = obj.getFullYear();
    var days  = obj.getDate();
    var month = obj.getMonth();
    
    if (month == 0) return days;
    if (month >= 1) days += 31; 
    if (month >= 2) days += 28;

        // Leap years. Crude, but if this code is still being used
        // when it stops working, then you have my permission to shoot
        // me. Oh, you won't be able to - I'll be dead...
        if (year >= 2008 && year % 4 == 0) days += 1;

    if (month >= 3) days += 31;
    if (month >= 4) days += 30;
    if (month >= 5) days += 31;
    if (month >= 6) days += 30;
    if (month >= 7) days += 31;
    if (month >= 8) days += 31;
    if (month >= 9) days += 30;
    if (month >= 10) days += 31;
    if (month >= 11) days += 30;
    
    return days;
}


/**
* Draws the graph key (used by various graphs)
* 
* @param object obj The graph object
* @param array  key An array of the texts to be listed in the key
* @param colors An array of the colors to be used
*/
RGraph.DrawKey = function (obj, key, colors)
{
    var canvas  = obj.canvas;
    var context = obj.context;
    context.lineWidth = 1;

    context.beginPath();

    /**
    * Key positioned in the gutter (much like my humour)
    */
    var keypos   = obj.Get('chart.key.position');
    var textsize = obj.Get('chart.text.size');
    var gutter   = obj.Get('chart.gutter');

    if (keypos && keypos == 'gutter') {

        // Measure the texts
        var length = 0;
        var key    = obj.Get('chart.key');

        /**
        * Work out the center position
        */
        if (obj.type == 'pie' && obj.Get('chart.align') == 'left') {
            var centerx = obj.radius + obj.Get('chart.gutter');
        
        } else if (obj.type == 'pie' && obj.Get('chart.align') == 'right') {
            var centerx = obj.canvas.width - obj.radius - obj.Get('chart.gutter');

        } else {
            var centerx = canvas.width / 2;
        }

        context.font = obj.Get('chart.text.size') + 'pt ' + obj.Get('chart.text.font');

        for (i=0; i<key.length; ++i) {
            length += context.measureText(key[i]).width;
            length += 20; // This accounts for the square of color
            length += 10;// And this is an extra 10 pixels on the right of each bit of text
        }
        
        var start = centerx - (length / 2);

        for (i=0; i<key.length; ++i) {
            start += 10;
            context.fillStyle = colors[i];

            // Draw the rectangle of color
            context.fillRect(start + 9, gutter - 5 - textsize, textsize, textsize + 1);
            context.stroke();
            context.fill();

            context.fillStyle = obj.Get('chart.text.color');
            RGraph.Text(context, obj.Get('chart.text.font'), textsize,
                                         start + 25,
                                         gutter - 6 - textsize,
                                         key[i],
                                         'top');
            context.fill();

            // Draw the text
            //
            start += context.measureText(key[i]).width + 15;
        }


    /**
    * In-graph style key
    */
    } else if (keypos && keypos == 'graph') {

        // Need to set this so that measuring the text works out OK
        context.font = textsize + 'pt ' + obj.Get('chart.text.font');

        // Work out the longest bit of text
        var width = 0;
        for (i=0; i<key.length; ++i) {
            width = Math.max(width, context.measureText(key[i]).width);
        }

        width += 32;

        /**
        * Stipulate the shadow for the key box
        */
        if (obj.Get('chart.key.shadow')) {
            context.shadowColor = '#666';
            context.shadowBlur = 3;
            context.shadowOffsetX = 2;
            context.shadowOffsetY = 2;
        }

        /**
        * Draw the box that the key resides in
        */
        context.beginPath();
        context.fillStyle   = obj.Get('chart.key.background');
        context.strokeStyle = 'black';

        // The x position of the key box
        var xpos = canvas.width - width - gutter;
        
        if (obj.Get('chart.yaxispos') == 'right') {
            xpos -= (obj.canvas.width - (obj.Get('chart.gutter') * 2));
            xpos += width + 6;
        }

        if (arguments[3] != false) {

            // Manually draw the MSIE shadow
            if (document.all && obj.Get('chart.key.shadow')) {
                context.beginPath();
                context.fillStyle   = '#666';
                context.fillRect(xpos + 2, gutter + 5 + 2, width - 5, 5 + ( (textsize + 5) * key.length));
                context.fill();
                context.fillStyle   = obj.Get('chart.key.background');
            }

            context.strokeRect(xpos, gutter + 5, width - 5, 5 + ( (textsize + 5) * key.length));
            context.fillRect(xpos, gutter + 5, width - 5, 5 + ( (textsize + 5) * key.length) );
        }

        // Turns off the shadow
        context.shadowColor = 'rgba(0,0,0,0)';

        // Draw the labels given
        for (var i=key.length - 1; i>=0; i--) {
            var j = Number(i) + 1;

            // Draw the rectangle of color
            context.fillStyle = colors[i];
            context.fillRect(xpos + 5, 5 + gutter + (5 * j) + (textsize * j) - (textsize), textsize, textsize);

            context.fill();
            context.stroke();

            context.fillStyle = obj.Get('chart.text.color');

            RGraph.Text(
                        context,
                        obj.Get('chart.text.font'),
                        textsize,
                        xpos + 21,
                        gutter + (5 * j) + (textsize * j) + 4,
                        key[i]
                       );
        }
    
    } else {
        alert('[COMMON] (' + obj.id + ') Unknown key position: ' + keypos);
    }
}


/**
* A shortcut for RGraph.pr()
*/
function pd(variable)
{
    RGraph.pr(variable);
}


/**
* Makes a clone of an object
* 
* @param obj val The object to clone
*/
RGraph.array_clone = function (obj)
{
    if(obj == null || typeof(obj) != 'object') {
        return obj;
    }

    var temp = [];
    //var temp = new obj.constructor();

    for(var i=0;i<obj.length; ++i) {
        temp[i] = RGraph.array_clone(obj[i]);
    }

    return temp;
}


/**
* This function reverses an array
*/
RGraph.array_reverse = function (arr)
{
    var newarr = [];

    for (var i=arr.length - 1; i>=0; i--) {
        newarr.push(arr[i]);
    }

    return newarr;
}


/**
* Formats a number with thousand seperators so it's easier to read
* 
* @param  integer num The number to format
* @return string      The formatted number
*/
RGraph.number_format = function (num)
{
    var i;
    var prepend = arguments[1] ? String(arguments[1]) : '';
    var append  = arguments[2] ? String(arguments[2]) : '';
    var output  = '';
    var decimal = '';
    RegExp.$1   = '';

    // Ignore the preformatted version of "1e-2"
    if (String(num).indexOf('e') > 0) {
        return String(prepend + String(num) + append);
    }

    // We need then number as a string
    num = String(num);
    
    // Take off the decimal part - we re-append it later
    if (num.indexOf('.') > 0) {
        num     = num.replace(/\.(.*)/, '');
        decimal = RegExp.$1;
    }

    // Thousand seperator
    //var seperator = arguments[1] ? String(arguments[1]) : ',';
    var seperator = ',';
    
    /**
    * Work backwards adding the thousand seperators
    */
    var foundPoint;
    for (i=(num.length - 1),j=0; i>=0; j++,i--) {
        var character = num.charAt(i);
        
        if ( j % 3 == 0 && j != 0) {
            output += seperator;
        }
        
        /**
        * Build the output
        */
        output += character;
    }
    
    /**
    * Now need to reverse the string
    */
    var rev = output;
    output = '';
    for (i=(rev.length - 1); i>=0; i--) {
        output += rev.charAt(i);
    }

    // Tidy up
    output = output.replace(/^-,/, '-');

    // Reappend the decimal
    if (decimal.length) {
        output =  output + '.' + decimal;
        decimal = '';
        RegExp.$1 = '';
    }

    // Minor bugette
    if (output.charAt(0) == '-') {
        output *= -1;
        prepend = '-' + prepend;
    }

    return prepend + output + append;
}


/**
* This gunction shows a context menu containing the parameters
* provided to it
* 
* @param object canvas    The canvas object
* @param array  menuitems The context menu menuitems
* @param object e         The event object
*/
RGraph.Contextmenu = function (canvas, menuitems, e)
{
    e = RGraph.FixEventObject(e);

    /**
    * Hide any existing menu
    */
    if (RGraph.Registry.Get('chart.contextmenu')) {
        RGraph.HideContext();
    }
    
    // Hide any zoomed canvas
    RGraph.HideZoomedCanvas();

    /**
    * Hide the palette if necessary
    */
    RGraph.HidePalette();
    
    /**
    * This is here to ensure annotating is OFF
    */
    canvas.__object__.Set('chart.mousedown', false)

    var x      = e.pageX;
    var y      = e.pageY;
    var div    = document.createElement('div');
    var bg     = document.createElement('div');

    div.className = 'RGraph_contextmenu';
    div.__canvas__ = canvas; /* Store a reference to the canvas on the contextmenu object */
    div.style.position = 'absolute';
    div.style.left = 0;
    div.style.top = 0;
    div.style.border = '1px solid black';
    div.style.backgroundColor = 'white';
    div.style.boxShadow    = '3px 3px 3px rgba(96,96,96,0.5)';
    div.style.MozBoxShadow = '3px 3px 3px rgba(96,96,96,0.5)';
    div.style.WebkitBoxShadow = '3px 3px 3px rgba(96,96,96,0.5)';
    div.style.filter = 'progid:DXImageTransform.Microsoft.Shadow(color=#aaaaaa,direction=135)';
    div.style.opacity = 0; // TODO Not currently supported in MSIE

    bg.className = 'RGraph_contextmenu_background';
    bg.style.position = 'absolute';
    bg.style.backgroundColor = '#ccc';
    bg.style.borderRight = '1px solid #aaa';
    bg.style.top = 0;
    bg.style.left = 0;
    bg.style.width = '18px';
    bg.style.height = '100%';
    bg.style.opacity = 0;


    div = document.body.appendChild(div);
    bg  = div.appendChild(bg);


    /**
    * Now add the context menu items
    */
    for (i=0; i<menuitems.length; ++i) {
        
        var menuitem = document.createElement('div');
        
        menuitem.__canvas__ = canvas;
        menuitem.className = 'RGraph_contextmenu_item';
        
        if (menuitems[i]) {
            menuitem.style.padding = '2px 5px 2px 23px';
            menuitem.style.fontFamily = 'Arial';
            menuitem.style.fontSize = '10pt';
            menuitem.style.fontWeight = 'normal';
            menuitem.innerHTML = menuitems[i][0];

            // Add the mouseover event
            if (menuitems[i][1]) {
                if (menuitem.addEventListener) {
                    menuitem.addEventListener("mouseover", function (e) {e.target.style.backgroundColor = '#eee'; e.target.style.cursor = 'pointer';}, false);
                    menuitem.addEventListener("mouseout", function (e) {e.target.style.backgroundColor = 'white'; e.target.style.cursor = 'default';}, false);
                } else  {
                    menuitem.attachEvent("onmouseover", function () {event.srcElement.style.backgroundColor = '#eee'; event.srcElement.style.cursor = 'hand'}, false);
                    menuitem.attachEvent("onmouseout", function () {event.srcElement.style.backgroundColor = 'white'; event.srcElement.style.cursor = 'default';}, false);
                }
            } else {
                if (menuitem.addEventListener) {
                    menuitem.addEventListener("mouseover", function (e) {e.target.style.cursor = 'default';}, false);
                    menuitem.addEventListener("mouseout", function (e) {e.target.style.cursor = 'default';}, false);
                } else  {
                    menuitem.attachEvent("onmouseover", function () {event.srcElement.style.cursor = 'default'}, false);
                    menuitem.attachEvent("onmouseout", function () {event.srcElement.style.cursor = 'default';}, false);
                }
            }

        } else {
            menuitem.style.borderBottom = '1px solid #ddd';
            menuitem.style.marginLeft = '25px';
        }

        div.appendChild(menuitem);

        /**
        * Install the event handler
        */
        if (menuitems[i] && menuitems[i][1]) {
            if (document.all) {
                menuitem.attachEvent('onclick', menuitems[i][1]);
                menuitem.attachEvent('onclick', function () {RGraph.HideContext();});
            } else {
                menuitem.addEventListener('click', menuitems[i][1], false);
            }
        }
    }
    
    /**
    * Now all the menu items have been added, set the shadow width
    * Shadow now handled by CSS3?
    */
    div.style.width = div.offsetWidth + 'px';

    /**
    * Set the background (the left bar) width if it's MSIE
    */
    if (document.all) {
        bg.style.height = (div.offsetHeight - 10) + 'px';
    }

    // Show the menu to the left or the right (normal) of the cursor?
    if (x + div.offsetWidth > document.body.offsetWidth) {
        x -= div.offsetWidth;
    }
    
    // Reposition the menu (now we have the real offsetWidth)
    div.style.left = x + 'px';
    div.style.top = y + 'px';

    /**
    * Do a little fade in effect
    */
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu')) obj.style.opacity = 0.2", 50);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu')) obj.style.opacity = 0.4", 100);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu')) obj.style.opacity = 0.6", 150);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu')) obj.style.opacity = 0.8", 200);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu')) obj.style.opacity = 1", 250);

    // The fade in effect on the left gray bar
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu.bg')) obj.style.opacity = 0.2", 50);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu.bg')) obj.style.opacity = 0.4", 100);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu.bg')) obj.style.opacity = 0.6", 150);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu.bg')) obj.style.opacity = 0.8", 200);
    setTimeout("if (obj = RGraph.Registry.Get('chart.contextmenu.bg')) obj.style.opacity = 1", 250);

    // Store the context menu in the registry
    RGraph.Registry.Set('chart.contextmenu', div);
    RGraph.Registry.Set('chart.contextmenu.bg', bg);
    RGraph.Registry.Get('chart.contextmenu').oncontextmenu = function () {return false;};
    RGraph.Registry.Get('chart.contextmenu.bg').oncontextmenu = function () {return false;};

    /**
    * Install the event handlers that hide the context menu
    */
    if (navigator.userAgent.indexOf('Opera') == -1) {
        canvas.onclick = function ()
        {
            RGraph.HideContext();
        }
    }

    window.onclick = function (e)
    {
        RGraph.HideContext();
        RGraph.Redraw();
        
        // Fire the onclick event again
        if (e.target.onclick && e.button == 0) {
            e.target.onclick(e);
        }
    }

    window.onresize = function () {RGraph.HideContext();}

    e.stopPropagation = true;
    e.cancelBubble    = true;

    return false;
}


/**
* Hides the context menu if it's currently visible
*/
RGraph.HideContext = function ()
{
    var cm   = RGraph.Registry.Get('chart.contextmenu');
    var cmbg = RGraph.Registry.Get('chart.contextmenu.bg');

    if (cm) {
        cm.style.visibility = 'hidden';
        cm.style.display = 'none';
        RGraph.Registry.Set('chart.contextmenu', null);
        
        cmbg.style.visibility = 'hidden';
        cmbg.style.display = 'none';
        RGraph.Registry.Set('chart.contextmenu.bg', null);
    }
}


/**
* Shows the context menu after making a few checks - not opera (doesn't support oncontextmenu,
* not safari (tempermentality), not chrome (hmmm)
*/
RGraph.ShowContext = function (obj)
{
    RGraph.HidePalette();

    if (obj.Get('chart.contextmenu') && obj.Get('chart.contextmenu').length) {
    
        var isOpera      = navigator.userAgent.indexOf('Opera') >= 0;
        var isSafari     = navigator.userAgent.indexOf('Safari') >= 0;
        var isChrome     = navigator.userAgent.indexOf('Chrome') >= 0;
        var isMacFirefox = navigator.userAgent.indexOf('Firefox') > 0 && navigator.userAgent.indexOf('Mac') > 0;

        if (((!isOpera && !isSafari) || isChrome) && !isMacFirefox) {

            obj.canvas.oncontextmenu = function (e)
            {
                e = RGraph.FixEventObject(e);

                if (e.ctrlKey) return true;

                RGraph.Contextmenu(obj.canvas, obj.Get('chart.contextmenu'), e);
                return false;
            }
        
        // Accomodate Opera and Safari - use double click event
        } else {

            obj.canvas.addEventListener('dblclick', function (e)
            {
                if (e.ctrlKey) return true;

                if (!RGraph.Registry.Get('chart.contextmenu')) {
                    RGraph.Contextmenu(obj.canvas, obj.Get('chart.contextmenu'), e);
                }
            }, false);
        }
    }
}


/**
* Draws horizontal coloured bars on something like the bar, line or scatter
*/
RGraph.DrawBars = function (obj)
{
    var hbars = obj.Get('chart.background.hbars');

    /**
    * Draws a horizontal bar
    */
    obj.context.beginPath();
    
    for (i=0; i<hbars.length; ++i) {
        
        // If null is specified as the "height", set it to the upper max value
        if (hbars[i][1] == null) {
            hbars[i][1] = obj.max;
        
        // If the first index plus the second index is greater than the max value, adjust accordingly
        } else if (hbars[i][0] + hbars[i][1] > obj.max) {
            hbars[i][1] = obj.max - hbars[i][0];
        }


        // If height is negative, and the abs() value is greater than .max, use a negative max instead
        if (Math.abs(hbars[i][1]) > obj.max) {
            hbars[i][1] = -1 * obj.max;
        }


        // If start point is greater than max, change it to max
        if (Math.abs(hbars[i][0]) > obj.max) {
            hbars[i][0] = obj.max;
        }
        
        // If start point plus height is less than negative max, use the negative max plus the start point
        if (hbars[i][0] + hbars[i][1] < (-1 * obj.max) ) {
            hbars[i][1] = -1 * (obj.max + hbars[i][0]);
        }

        var ystart = (obj.grapharea - ((hbars[i][0] / obj.max) * obj.grapharea));
        var height = (Math.min(hbars[i][1], obj.max - hbars[i][0]) / obj.max) * obj.grapharea;

        // Account for the X axis being in the center
        if (obj.Get('chart.xaxispos') == 'center') {
            ystart /= 2;
            height /= 2;
        }
        
        ystart += obj.Get('chart.gutter')

        var x = obj.Get('chart.gutter');
        var y = ystart - height;
        var w = obj.canvas.width - (2 * obj.Get('chart.gutter'));
        var h = height;
        
        // Accommodate Opera :-/
        if (navigator.userAgent.indexOf('Opera') != -1 && obj.Get('chart.xaxispos') == 'center' && h < 0) {
            h *= -1;
            y = y - h;
        }

        obj.context.fillStyle = hbars[i][2];
        obj.context.fillRect(x, y, w, h);
    }

    obj.context.fill();
}


/**
* Draws in-graph labels.
* 
* @param object obj The graph object
*/
RGraph.DrawInGraphLabels = function (obj)
{
    var canvas  = obj.canvas;
    var context = obj.context;
    var labels  = obj.Get('chart.labels.ingraph');

    /**
    * Turn off any shadow
    */
    RGraph.NoShadow(obj);

    if (labels && labels.length > 0) {

        for (var i=0; i<labels.length; ++i) {
            if (labels[i]) {
                var coords = obj.coords[i];
                
                if (coords && coords.length > 0) {
                    var x = (obj.type == 'bar' ? coords[0] + (coords[2] / 2) : coords[0]);
                    var y = (obj.type == 'bar' ? coords[1] + (coords[3] / 2) : coords[1]) - 5;

                    context.beginPath();
                    context.fillStyle = 'black';
                    context.strokeStyle = '#666';

                    if (obj.type == 'bar') {

                        if (obj.Get('chart.variant') == 'dot') {
                            context.moveTo(x, y - 15);
                            context.lineTo(x, y - 25);
                        
                        } else if (obj.Get('chart.variant') == 'arrow') {
                            context.moveTo(x, y - 15);
                            context.lineTo(x, y - 25);
                        
                        } else {

                            context.arc(x, y, 1, 0, 6.28, 0);
                            context.moveTo(x, y);
                            context.lineTo(x, y - 25);
                        }

                    } else if (obj.type == 'line') {

                        context.moveTo(x, y - 5);
                        context.lineTo(x, y - 25);
                        
                        // This draws the arrow
                        context.moveTo(x, y);
                        context.lineTo(x - 3, y - 7);
                        context.lineTo(x + 3, y - 7);
                        context.closePath();
                        
                        
                    }

                    context.stroke();
                    context.fill();

                    var width = context.measureText(labels[i]).width;
                    RGraph.Text(context, 'Verdana', obj.Get('chart.text.size'), x, y - 25, String(labels[i]), 'bottom', 'center', null, null, '#fff');

                    context.fill();
                }
            }
        }
    }
}


/**
* This function "fills in" key missing properties that various implementations lack
* 
* @param object e The event object
*/
RGraph.FixEventObject = function (e)
{
    if (document.all) {
        
        var e = event;

        e.pageX  = (event.clientX + document.body.scrollLeft);
        e.pageY  = (event.clientY + document.body.scrollTop);
        e.target = event.srcElement;
        
        if (!document.body.scrollTop && document.documentElement.scrollTop) {
            e.pageX += parseInt(document.documentElement.scrollLeft);
            e.pageY += parseInt(document.documentElement.scrollTop);
        }
    }

    // This is mainly for FF which doesn't provide offsetX
    if (typeof(e.offsetX) == 'undefined' && typeof(e.offsetY) == 'undefined') {
        var coords = RGraph.getMouseXY(e);
        e.offsetX = coords[0];
        e.offsetY = coords[1];
    }
    
    return e;
}


/**
* Draw crosshairs if enabled
* 
* @param object obj The graph object (from which we can get the context and canvas as required)
*/
RGraph.DrawCrosshairs = function (obj)
{
    if (obj.Get('chart.crosshairs')) {
        var canvas  = obj.canvas;
        var context = obj.context;
        
        if (obj.Get('chart.tooltips') && obj.Get('chart.tooltips').length > 0) {
            alert('[' + obj.type.toUpperCase() + '] Sorry - you cannot have crosshairs enabled with tooltips! Turning off crosshairs...');
            obj.Set('chart.crosshairs', false);
            return;
        }
        
        canvas.onmousemove = function (e)
        {
            var e       = RGraph.FixEventObject(e);
            var canvas  = obj.canvas;
            var context = obj.context;
            var gutter  = obj.Get('chart.gutter');
            var width   = canvas.width;
            var height  = canvas.height;

            var mouseCoords = RGraph.getMouseXY(e);
            var x = mouseCoords[0];
            var y = mouseCoords[1];

            RGraph.Clear(canvas);
            obj.Draw();

            if (   x > gutter
                && y > gutter
                && x < (width - gutter)
                && y < (height - gutter)
               ) {

                context.lineWidth = 1;

                context.beginPath();
                context.strokeStyle = obj.Get('chart.crosshairs.color');
                
                // Draw a top vertical line
                context.moveTo(x, gutter);
                context.lineTo(x, height - gutter);
                
                // Draw a horizontal line
                context.moveTo(gutter, y);
                context.lineTo(width - gutter, y);

                context.stroke();
            }
        }
    }
}


/**
* The function which controls the annotate feature
* 
* @param object obj The graph object
* @param bool       True if it's a donut, and therefore don't replay the annotations
*/
RGraph.Annotate = function (obj)
{
    /**
    * This installs some event handlers
    */
    if (obj.Get('chart.annotatable')) {

        var canvas  = obj.canvas;
        var context = obj.context;
        
        /**
        * Capture the mouse events so we can set whther the mouse is down or not
        */
            canvas.onmousedown = function (e)
            {
                if (e.button == 0) {

                    e.target.__object__.Set('chart.mousedown', true);

                    // Get the context
                    var context = e.target.__object__.canvas.getContext('2d');

                    // Don't want any "joining" lines or colour "bleeding"
                    context.beginPath();

                    // Accommodate Chrome
                    var coords = RGraph.getMouseXY(e);
                    var x      = coords[0];
                    var y      = coords[1];
                    
                    // Clear the annotation recording
                    RGraph.Registry.Set('annotate.actions', [obj.Get('chart.annotate.color')]);

                    context.strokeStyle = obj.Get('chart.annotate.color');

                    context.moveTo(x, y);
                
                    // Set the lineWidth
                    context.lineWidth = 1;
                    
                    RGraph.Registry.Set('started.annotating', false);
                }
                
                return false;
            }
            
            /**
            * This cancels annotating for ALL canvases
            */
            window.onmouseup = function (e)
            {
                var tags = document.getElementsByTagName('canvas');

                for (var i=0; i<tags.length; ++i) {
                    if (tags[i].__object__) {
                        tags[i].__object__.Set('chart.mousedown', false);
                    }
                }

                // Store the annotations in browser storage if it's available
                if (RGraph.Registry.Get('annotate.actions') && RGraph.Registry.Get('annotate.actions').length > 0 && window.localStorage) {

                    var id = '__rgraph_annotations_' + e.target.id + '__';
                    var annotations  = window.localStorage[id] ? window.localStorage[id] + '|' : '';
                        annotations += RGraph.Registry.Get('annotate.actions');

                    // Store the annotations information in HTML5 browser storage here
                    window.localStorage[id] = annotations;
                }

                // Clear the recorded annotations
                RGraph.Registry.Set('annotate.actions', []);
            }
            
            canvas.onmouseup = window.onmouseup;
            canvas.onmouseout = window.onmouseup;

        /**
        * The canvas onmousemove function
        */
        canvas.onmousemove = function (e)
        {
            var e      = RGraph.FixEventObject(e);
            var obj    = e.target.__object__;
            var coords = RGraph.getMouseXY(e);
            var x      = coords[0];
            var y      = coords[1];
            var gutter = obj.Get('chart.gutter');
            var width  = canvas.width;
            var height = canvas.height;

            obj.context.lineWidth = 1;

            // Don't allow annotating in the gutter
            if (
                x > gutter && x < (width - gutter)
                && y > gutter && y < (height - gutter)
               ) {
            
                canvas.style.cursor = 'crosshair';
            
                if (obj.Get('chart.mousedown')) {

                    // Don't allow annotating in the gutter
                    if (
                        x > gutter && x < (width - gutter)
                        && y > gutter && y < (height - gutter)
                       ) {
                       
                       // Special case for HBars and Gantts with their extra wide left gutter
                       if ( (obj.type != 'hbar' && obj.type != 'gantt') || x > (3 * gutter)) {

                           /**
                           * This is here to stop annotating in the gutter
                           */
                            if (RGraph.Registry.Get('started.annotating') == false) {
                                context.moveTo(x, y);
                                RGraph.Registry.Set('started.annotating', true)
                            }

                            context.lineTo(x, y);

                            RGraph.Registry.Set('annotate.actions', RGraph.Registry.Get('annotate.actions') + '|' + x + ',' + y);

                            context.stroke();
                        }

                    // No drawing in the gutter
                    } else {
                        context.moveTo(x, y);
                    }
                }

            } else {
                canvas.style.cursor = 'default';
            }
        }

        /**
        * Replay annotations
        */
        if (!arguments[1]) {
            RGraph.ReplayAnnotations(obj);
        }
    }
}


/**
* Shows the mini palette used for annotations
* 
* @param object e The event object
*/
RGraph.Showpalette = function (e)
{
    var isSafari = navigator.userAgent.indexOf('Safari') ? true : false;

    e = RGraph.FixEventObject(e);

    var canvas  = e.target.parentNode.__canvas__;
    var context = canvas.getContext('2d');
    var obj     = canvas.__object__;
    var div = document.createElement('DIV');
    var coords = RGraph.getMouseXY(e);
    
    div.__object__               = obj;             // The graph object
    div.className                = 'RGraph_palette';
    div.style.position           = 'absolute';
    div.style.backgroundColor    = 'white';
    div.style.border             = '1px solid black';
    div.style.left               = 0;
    div.style.top                = 0;
    div.style.padding            = '3px';
    div.style.paddingBottom      = 0;
    div.style.paddingRight       = 0;
    div.style.opacity            = 0;
    div.style.boxShadow          = 'rgba(96,96,96,0.5) 3px 3px 3px';
    div.style.WebkitBoxShadow    = 'rgba(96,96,96,0.5) 3px 3px 3px';
    div.style.MozBoxShadow       = 'rgba(96,96,96,0.5) 3px 3px 3px';
    div.style.filter             = 'progid:DXImageTransform.Microsoft.Shadow(color=#666666,direction=135)';
    
    var common_css       = 'padding: 1px; display: inline; display: inline; display: inline-block; width: 15px; height: 15px; margin-right: 3px; cursor: ' + (document.all ? 'hand;' : 'pointer; ') + (isSafari ? 'margin-bottom: 3px' : '');
    var common_mouseover = ' onmouseover="this.style.border = \'1px black solid\'; this.style.padding = 0"';
    var common_mouseout  = ' onmouseout="this.style.border = 0; this.style.padding = \'1px\'" ';

    var str = '';

    var colors = ['red', 'blue', 'green', 'black', 'yellow', 'magenta', 'pink', 'cyan', 'purple', '#ddf', 'gray', '#36905c'];

    for (i=0; i<colors.length; ++i) {
        str = str + '<span ' + common_mouseover + common_mouseout + ' style="background-color: ' + colors[i] + '; ' + common_css  + '" onclick="this.parentNode.__object__.Set(\'chart.annotate.color\', this.style.backgroundColor); this.parentNode.style.display = \'none\'">&nbsp;</span>';
        
        // This makes the colours go across two levels
        if (i == 5) {
            str += '<br />';
        }
    }

    div.innerHTML = str;
    document.body.appendChild(div);
    
    /**
    * Now the div has been added to the document, move it up and left and set the width and height
    */
    div.style.width  = (div.offsetWidth - 5) + 'px';
    div.style.height = (div.offsetHeight - 5) + 'px';
    div.style.left   = Math.max(0, e.pageX - div.offsetWidth - 2) + 'px';
    div.style.top    = (e.pageY - div.offsetHeight - 2) + 'px';

    /**
    * Store the palette div in the registry
    */
    RGraph.Registry.Set('palette', div);
    
    setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.2", 50);
    setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.4", 100);
    setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.6", 150);
    setTimeout("RGraph.Registry.Get('palette').style.opacity = 0.8", 200);
    setTimeout("RGraph.Registry.Get('palette').style.opacity = 1", 250);

    RGraph.HideContext();

    window.onclick = function ()
    {
        RGraph.HidePalette();
    }

    e.cancelBubble = true;
    e.stopPropagation = true;
}


/**
* Hides the palette if it's visible
*/
RGraph.HidePalette = function ()
{
    var div = RGraph.Registry.Get('palette');

    if (typeof(div) == 'object' && div) {
        div.style.visibility = 'hidden';
        div.style.display    = 'none';
        RGraph.Registry.Set('palette', null);
    }
}


/**
* Clears any annotation data from global storage
* 
* @param string id The ID of the canvas
*/
RGraph.ClearAnnotations = function (id)
{
    if (window.localStorage && window.localStorage['__rgraph_annotations_' + id + '__'] && window.localStorage['__rgraph_annotations_' + id + '__'].length) {
        window.localStorage['__rgraph_annotations_' + id + '__'] = [];
    }
}


/**
* Replays stored annotations
* 
* @param object obj The graph object
*/
RGraph.ReplayAnnotations = function (obj)
{
    // Check for support
    if (!window.localStorage) {
        return;
    }

    var context     = obj.context;
    var annotations = window.localStorage['__rgraph_annotations_' + obj.id + '__'];
    var i, len, move, coords;

    context.lineWidth = 2;

    if (annotations && annotations.length) {
        annotations = annotations.split('|');
    } else {
        return;
    }

    for (i=0, len=annotations.length; i<len; ++i) {
        if (!annotations[i].match(/^[0-9]+,[0-9]+$/)) {
            context.stroke();
            context.beginPath();
            context.strokeStyle = annotations[i];
            move = true;
            continue;
        }
        
        coords = annotations[i].split(',');

        if (move) {
            context.moveTo(coords[0], coords[1]);
            move = false;
        } else {
            context.lineTo(coords[0], coords[1]);
        }
    }
    
    context.stroke();
}


/**
* Trims the right hand side of a string. Removes SPACE, TAB
* CR and LF.
* 
* @param string str The string to trim
*/
RGraph.rtrim = function (str)
{
    return str.replace(/( |\n|\r|\t)+$/, '');
}

/**
* Draws the3D axes/background
*/
RGraph.Draw3DAxes = function (obj)
{
    var gutter  = obj.Get('chart.gutter');
    var context = obj.context;
    var canvas  = obj.canvas;

    context.strokeStyle = '#aaa';
    context.fillStyle = '#ddd';

    // Draw the vertical left side
    context.beginPath();
        context.moveTo(gutter, gutter);
        context.lineTo(gutter + 10, gutter - 5);
        context.lineTo(gutter + 10, canvas.height - gutter - 5);
        context.lineTo(gutter, canvas.height - gutter);
    context.closePath();
    
    context.stroke();
    context.fill();

    // Draw the bottom floor
    context.beginPath();
        context.moveTo(gutter, canvas.height - gutter);
        context.lineTo(gutter + 10, canvas.height - gutter - 5);
        context.lineTo(canvas.width - gutter + 10,  canvas.height - gutter - 5);
        context.lineTo(canvas.width - gutter, canvas.height - gutter);
    context.closePath();
    
    context.stroke();
    context.fill();
}

/**
* Turns off any shadow
* 
* @param object obj The graph object
*/
RGraph.NoShadow = function (obj)
{
    obj.context.shadowColor   = 'rgba(0,0,0,0)';
    obj.context.shadowBlur    = 0;
    obj.context.shadowOffsetX = 0;
    obj.context.shadowOffsetY = 0;
}


/**
* A zoom in function
* 
* @param e object The event object
*/
RGraph.Zoom = function (e)
{
    e = RGraph.FixEventObject(e);

    /**
    * Show the zoom window
    */
    if (e.target.parentNode.__canvas__.__object__.Get('chart.zoom.mode') == 'window') {
        return RGraph.ZoomWindow(e);
    }


    var canvas  = e.target.__canvas__;
    var context = canvas.getContext('2d');
    var obj     = canvas.__object__;
    var tmp     = canvas;
    var coords = RGraph.getCanvasXY(canvas);
    var factor = obj.Get('chart.zoom.factor') - 1;

    var x = coords[0];
    var y = coords[1];

    var img = document.createElement('img');
    img.className    = 'RGraph_zoomed_canvas';
    img.style.border = '3px solid gray';
    img.style.width  = canvas.width + 'px';
    img.style.height = canvas.height + 'px';
    img.style.position = 'absolute';
    img.style.left = x + 'px';
    img.style.top = y + 'px';
    img.style.backgroundColor = 'white';
    img.style.opacity = obj.Get('chart.zoom.fade.in') ? 0 : 1;
    img.style.zIndex = 99;
    img.src = canvas.toDataURL();

    document.body.appendChild(img);

    //RGraph.Registry.Set('chart.zoomedimage', img);
    // Store the zoomed image in a global var - NOT the registry
    __zoomedimage__ = img;
    __zoomedimage__.obj = obj;
    
    // Image onclick should not hide the image
    img.onclick = function (e)
    {
        e.cancelBubble    = true;
        if (document.all) event.stopPropagation();
        return false;
    }

    setTimeout(function () {window.onclick = RGraph.HideZoomedCanvas;}, 1);
    
    var width = parseInt(canvas.width);
    var height = parseInt(canvas.height);
    var frames = obj.Get('chart.zoom.frames');
    var delay  = obj.Get('chart.zoom.delay');

    // Increase the width over 10 frames - center
    if (obj.Get('chart.zoom.hdir') == 'center') {

        for (var i=1; i<=frames; ++i) {
            var newWidth      = width * factor * (i/frames) + width;
            var rightHandEdge = x + canvas.width;
            var newLeft       = (x + (canvas.width / 2)) - (newWidth / 2);

            setTimeout("__zoomedimage__.style.width = '" + String(newWidth) + "px'; __zoomedimage__.style.left = '" + newLeft + "px'", i * delay);
        }

    // Left
    } else if (obj.Get('chart.zoom.hdir') == 'left') {
        for (var i=1; i<=frames; ++i) {
            var newWidth      = width * factor * (i/frames) + width;
            var rightHandEdge = x + canvas.width;
            var newLeft       = rightHandEdge - newWidth;

            setTimeout("__zoomedimage__.style.width = '" + String(newWidth) + "px'; __zoomedimage__.style.left = '" + newLeft + "px'", i * delay);
        }
        
    // Right (default)
    } else {
        for (var i=1; i<=frames; ++i) {
            var newWidth      = width * factor * (i/frames) + width;
            setTimeout("__zoomedimage__.style.width = '" + String(newWidth) + "px'", i * delay);
        }
    }

    // Increase the height over 10 frames - up
    if (obj.Get('chart.zoom.vdir') == 'up') {
        for (var i=1; i<=frames; ++i) {
            var newHeight  = (height * factor * (i/frames)) + height;
            var bottomEdge = y + canvas.height;
            var newTop       = bottomEdge - newHeight;
    
            setTimeout("__zoomedimage__.style.height = '" + String(newHeight) + "px'; __zoomedimage__.style.top = '" + newTop + "px'", i * delay);
        }
    
    // center
    } else if (obj.Get('chart.zoom.vdir') == 'center') {
        for (var i=1; i<=frames; ++i) {
            var newHeight  = (height * factor * (i/frames)) + height;
            var bottomEdge = (y + (canvas.height / 2)) + (newHeight / 2);
            var newTop       = bottomEdge - newHeight;

            setTimeout("__zoomedimage__.style.height = '" + String(newHeight) + "px'; __zoomedimage__.style.top = '" + newTop + "px'", i * delay);
        }
    
    // Down (default
    } else {
        for (var i=1; i<=frames; ++i) {
            setTimeout("__zoomedimage__.style.height = '" + String(height * factor * (i/frames) + height) + "px'", i * delay);
        }
    }

    // If enabled, increase the opactity over 10 frames
    if (obj.Get('chart.zoom.fade.in')) {
        for (var i=1; i<=frames; ++i) {
            setTimeout("__zoomedimage__.style.opacity = " + String(i / frames), i * delay);
        }
    }

    // If stipulated, produce a shadow
    if (obj.Get('chart.zoom.shadow')) {
        for (var i=1; i<=frames; ++i) {
            setTimeout("__zoomedimage__.style.boxShadow = 'rgba(128,128,128," + Number(i / frames) / 2 + ") 0 0 15px'", i * delay);
            setTimeout("__zoomedimage__.style.MozBoxShadow = 'rgba(128,128,128," + Number(i / frames) / 2 + ") 0 0 15px'", i * delay);
            setTimeout("__zoomedimage__.style.WebkitBoxShadow = 'rgba(128,128,128," + Number(i / frames) / 2 + ") 0 0 15px'", i * delay);
        }
    }

    // The background
    if (obj.Get('chart.zoom.background')) {
        var div = document.createElement('DIV');
        div.style.backgroundColor = '#999';
        div.style.opacity         = 0;
        div.style.position        = 'absolute';
        div.style.top             = 0;
        div.style.left            = 0;
        div.style.width           = RGraph.getPageWidth() + 'px';
        div.style.height          = RGraph.getPageHeight() + 'px';
        //div.style.opacity         = 0;
        div.style.zIndex          = 98;

        // Hides the zoomed caboodle
        div.oncontextmenu = function (e)
        {
            return RGraph.HideZoomedCanvas(e);
        }

        for (var i=1; i<=frames; ++i) {
            setTimeout('__zoomedbackground__.style.opacity = ' + Number(0.04 * i), i * delay);
            
            //  MSIE doesn't support zoom
            //setTimeout('__zoomedbackground__.style.filter = "progid:DXImageTransform.Microsoft.Shadow(color=#aaaaaa,direction=135); Alpha(opacity=10)"', 50);
        }
        
        div.origHeight = div.style.height;
        
        document.body.appendChild(div);

        __zoomedbackground__ = div;
        
        // If the window is resized, hide the zoom
        window.onresize = RGraph.HideZoomedCanvas;

        for (var i=1; i<=frames; ++i) {
            setTimeout("__zoomedbackground__.style.opacity = " + (Number(i / frames) * 0.5), i * delay);
        }
    }
}


/**
* Installs the evnt handler for the zoom window
*/
RGraph.ZoomWindow = function (canvas)
{
    canvas.onmousemove = function (e)
    {
        e = RGraph.FixEventObject(e);

        var obj     = e.target.__object__;
        var canvas  = obj.canvas;
        var context = obj.context;

        var coords = RGraph.getMouseXY(e);
        
        /**
        * Create the DIV
        */
        if (!RGraph.Registry.Get('chart.zoomed.div')) {

            var div = document.createElement('div');
            div.className    = 'RGraph_zoom_window';
            div.style.width  = obj.Get('chart.zoom.thumbnail.width') + 'px';
            div.style.height = obj.Get('chart.zoom.thumbnail.height') + 'px';
            div.style.border = '2px dashed gray';
            div.style.position = 'absolute';
            div.style.overflow = 'hidden';
            div.style.backgroundColor = 'white';
            
            // Initially the zoomed layer should be off-screen
            div.style.left = '-1000px';
            div.style.top = '-1000px';
            
            div.style.borderRadius       = '5px';
            div.style.MozBorderRadius    = '5px';
            div.style.WebkitBorderRadius = '5px';

            if (obj.Get('chart.zoom.shadow')) {
                div.style.boxShadow       = 'rgba(0,0,0,0.5) 3px 3px 3px';
                div.style.MozBoxShadow    = 'rgba(0,0,0,0.5) 3px 3px 3px';
                div.style.WebkitBoxShadow = 'rgba(0,0,0,0.5) 3px 3px 3px';
            }

            //div.style.opacity = 0.2;
            div.__object__ = obj;
            document.body.appendChild(div);
    
            /**
            * Get the canvas as an image
            */
            var img = document.createElement('img');
            img.width  = obj.canvas.width * obj.Get('chart.zoom.factor');
            img.height = obj.canvas.height * obj.Get('chart.zoom.factor');
            img.style.position = 'relative';
            img.style.backgroundColor = 'white';

            img.src = obj.canvas.toDataURL();
            div.appendChild(img);

            RGraph.Registry.Set('chart.zoomed.div', div);
            RGraph.Registry.Set('chart.zoomed.img', img);
            
            // Fade the zoom in
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').__object__.canvas.onmouseover()", 5);

        } else {

            div = RGraph.Registry.Get('chart.zoomed.div');
            img = RGraph.Registry.Get('chart.zoomed.img');
        }
        
        /**
        * Ensure the div is visible
        */
        if (div && div.style.opacity < 1) {
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 1", 400);
        }

        /**
        * Get the canvas x/y coords
        */
        var c = RGraph.getCanvasXY(obj.canvas);
        var x = c[0];
        var y = c[1];

        /**
        * Position the div and img
        */
        var offset = 7;

        div.style.left = (e.pageX - obj.Get('chart.zoom.thumbnail.width') - offset) + 'px';
        div.style.top = (e.pageY -  obj.Get('chart.zoom.thumbnail.height') - offset) + 'px';
        
        var l = (obj.Get('chart.zoom.thumbnail.width') / 2) - (coords[0] * obj.Get('chart.zoom.factor'));
        var t = (obj.Get('chart.zoom.thumbnail.height') / 2) - (coords[1] * obj.Get('chart.zoom.factor'));

        // More positioning
        img.style.left = (l + ((obj.Get('chart.zoom.thumbnail.width') / 2) * obj.Get('chart.zoom.factor'))) + 'px';
        img.style.top = (t + ((obj.Get('chart.zoom.thumbnail.height') / 2) * obj.Get('chart.zoom.factor'))) + 'px';
    }
    
    /**
    * The onmouseover event. Evidently. Fades the zoom window in
    */
    canvas.onmouseover = function (e)
    {
        var div = RGraph.Registry.Get('chart.zoomed.div');
        
        // ???
        if (!div) return;

        var obj = div.__object__;

        // Used for the enlargement animation
        var targetWidth  = obj.Get('chart.zoom.thumbnail.width');
        var targetHeight = obj.Get('chart.zoom.thumbnail.height');

        div.style.width  = 0;
        div.style.height = 0;

        if (obj.Get('chart.zoom.fade.in')) {
            
            RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.2;
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.4", 100);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.6", 200);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.8", 300);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 1", 400);

        } else {

            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 1", 1);
        }

        // The enlargement animation frames
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.width = '" + (targetWidth * (1/5) ) + "px'", 75);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.width = '" + (targetWidth * (2/5) ) + "px'", 150);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.width = '" + (targetWidth * (3/5) ) + "px'", 225);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.width = '" + (targetWidth * (4/5) ) + "px'", 300);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.width = '" + (targetWidth * (5/5) ) + "px'", 325);
        
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.height = '" + (targetHeight * (1/5) ) + "px'", 75);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.height = '" + (targetHeight * (2/5) ) + "px'", 150);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.height = '" + (targetHeight * (3/5) ) + "px'", 225);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.height = '" + (targetHeight * (4/5) ) + "px'", 300);
        setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.height = '" + (targetHeight * (5/5) ) + "px'", 375);
    }
    
    /**
    * The onmouseout event. Hides the zoom window. Fades the zoom out
    */
    canvas.onmouseout = function (e)
    {
        if (RGraph.Registry.Get('chart.zoomed.div').__object__.Get('chart.zoom.fade.out')) {
            RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.8;
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.6", 100);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.4", 200);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0.2", 300);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.opacity = 0", 400);

            // Get rid of the zoom window
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.left = '-400px'", 400);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.top = '-400px'", 400);
        
        } else {

            // Get rid of the zoom window
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.left = '-400px'", 1);
            setTimeout("RGraph.Registry.Get('chart.zoomed.div').style.top = '-400px'", 1);
        }
    }
}


/**
* This function sets up the zoom window if requested
* 
* @param obj object The graph object
*/
RGraph.ShowZoomWindow = function (obj)
{
    var gutter = obj.Get('chart.gutter');

    if (obj.Get('chart.zoom.mode') == 'thumbnail') {
        RGraph.ZoomWindow(obj.canvas);
    }
}


/**
* This function attempts to "fill in" missing functions from the canvas
* context object. Only two at the moment - measureText() nd fillText().
* 
* @param object context The canvas 2D context
*/
RGraph.OldBrowserCompat = function (context)
{
    if (!context.measureText) {
    
        // This emulates the measureText() function
        context.measureText = function (text)
        {
            var textObj = document.createElement('DIV');
            textObj.innerHTML = text;
            textObj.style.backgroundColor = 'white';
            textObj.style.position = 'absolute';
            textObj.style.top = -100
            textObj.style.left = 0;
            document.body.appendChild(textObj);

            var width = {width: textObj.offsetWidth};
            
            textObj.style.display = 'none';
            
            return width;
        }
    }

    if (!context.fillText) {
        // This emulates the fillText() method
        context.fillText    = function (text, targetX, targetY)
        {
            return false;
        }
    }
}


/**
* This function is for use with circular graph types, eg the Pie or Radar. Pass it your event object
* and it will pass you back the corresponding segment details as an array:
* 
* [x, y, r, startAngle, endAngle]
* 
* Angles are measured in degrees
* 
* @param object e   Your event object
*/
RGraph.getSegment = function (e)
{
    RGraph.FixEventObject(e);

    var obj         = e.target.__object__;
    var canvas      = obj.canvas;
    var context     = obj.context;
    var mouseCoords = RGraph.getMouseXY(e);
    var x           = mouseCoords[0] - obj.centerx;
    var y           = mouseCoords[1] - obj.centery;
    var r           = obj.radius;
    var theta       = Math.atan(y / x); // RADIANS
    var hyp         = y / Math.sin(theta);
    var angles      = obj.angles;
    var ret         = [];

    // Put theta in DEGREES
    theta *= 57.3
    
    // hyp should not be greater than radius IF ITS A RADAR/DONUT CHART
    if (obj.type == 'radar' || obj.type == 'donut') {
        if (   (isNaN(hyp) && Math.abs(mouseCoords[0]) < (obj.centerx - r) )
            || (isNaN(hyp) && Math.abs(mouseCoords[0]) > (obj.centerx + r))
            || (!isNaN(hyp) && Math.abs(hyp) > r)) {
            return;

        /**
        * If it's actually a donut make sure the hyp is bigger
        * than the size of the hole in the middle
        */
        } else if (obj.Get('chart.isdonut') && Math.abs(hyp) < (obj.radius / 2)) {
            return;
        }
    }

    /**
    * Account for the correct quadrant
    */
    if (x < 0 && y >= 0) {
        theta += 180;
    } else if (x < 0 && y < 0) {
        theta += 180;
    } else if (x > 0 && y < 0) {
        theta += 360;
    }

    for (var i=0; i<angles.length; ++i) {
        if (theta >= angles[i][0] && theta < angles[i][1]) {

            hyp = Math.abs(hyp);

            if (obj.type == 'radar' && hyp > angles[i][2]) {
                return null;
            }

            if (obj.type == 'pie' && hyp > obj.radius) {
                return null;
            }

            if (obj.type == 'donut' && (hyp > obj.radius || hyp < obj.holewidth) ) {
                return null;
            }

            ret[0] = obj.centerx;
            ret[1] = obj.centery;
            ret[2] = (obj.type == 'radar') ? angles[i][2] : obj.radius;
            ret[3] = angles[i][0];
            ret[4] = angles[i][1];

            return ret;
        }
    }
    
    return null;
}


/**
* This is a function that can be used to run code asynchronously, which can
* be used to speed up the loading of you pages.
* 
* @param string func This is the code to run. It can also be a function pointer.
*                    The front page graphs show this function in action. Basically
*                   each graphs code is made in a function, and that function is
*                   passed to this function to run asychronously.
*/
RGraph.Async = function (func)
{
    return setTimeout(func, arguments[1] ? arguments[1] : 1);
}


/**
* A custom random number function
* 
* @param number min The minimum that the number should be
* @param number max The maximum that the number should be
* @param number    How many decimal places there should be. Default for this is 0
*/
RGraph.random = function (min, max)
{
    var dp = arguments[2] ? arguments[2] : 0;
    var r = Math.random();
    
    return Number((((max - min) * r) + min).toFixed(dp));
}


/**
* Draws a rectangle with curvy corners
* 
* @param context object The context
* @param x       number The X coordinate (top left of the square)
* @param y       number The Y coordinate (top left of the square)
* @param w       number The width of the rectangle
* @param h       number The height of the rectangle
* @param         number The radius of the curved corners
* @param         boolean Whether the top left corner is curvy
* @param         boolean Whether the top right corner is curvy
* @param         boolean Whether the bottom right corner is curvy
* @param         boolean Whether the bottom left corner is curvy
*/
RGraph.strokedCurvyRect = function (context, x, y, w, h)
{
    // The corner radius
    var r = arguments[5] ? arguments[5] : 3;

    // The corners
    var corner_tl = (arguments[6] || arguments[6] == null) ? true : false;
    var corner_tr = (arguments[7] || arguments[7] == null) ? true : false;
    var corner_br = (arguments[8] || arguments[8] == null) ? true : false;
    var corner_bl = (arguments[9] || arguments[9] == null) ? true : false;

    context.beginPath();

        // Top left side
        context.moveTo(x + (corner_tl ? r : 0), y);
        context.lineTo(x + w - (corner_tr ? r : 0), y);
        
        // Top right corner
        if (corner_tr) {
            context.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2, false);
        }

        // Top right side
        context.lineTo(x + w, y + h - (corner_br ? r : 0) );

        // Bottom right corner
        if (corner_br) {
            context.arc(x + w - r, y - r + h, r, Math.PI * 2, Math.PI * 0.5, false);
        }

        // Bottom right side
        context.lineTo(x + (corner_bl ? r : 0), y + h);

        // Bottom left corner
        if (corner_bl) {
            context.arc(x + r, y - r + h, r, Math.PI * 0.5, Math.PI, false);
        }

        // Bottom left side
        context.lineTo(x, y + (corner_tl ? r : 0) );

        // Top left corner
        if (corner_tl) {
            context.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
        }

    context.stroke();
}


/**
* Draws a filled rectangle with curvy corners
* 
* @param context object The context
* @param x       number The X coordinate (top left of the square)
* @param y       number The Y coordinate (top left of the square)
* @param w       number The width of the rectangle
* @param h       number The height of the rectangle
* @param         number The radius of the curved corners
* @param         boolean Whether the top left corner is curvy
* @param         boolean Whether the top right corner is curvy
* @param         boolean Whether the bottom right corner is curvy
* @param         boolean Whether the bottom left corner is curvy
*/
RGraph.filledCurvyRect = function (context, x, y, w, h)
{
    // The corner radius
    var r = arguments[5] ? arguments[5] : 3;

    // The corners
    var corner_tl = (arguments[6] || arguments[6] == null) ? true : false;
    var corner_tr = (arguments[7] || arguments[7] == null) ? true : false;
    var corner_br = (arguments[8] || arguments[8] == null) ? true : false;
    var corner_bl = (arguments[9] || arguments[9] == null) ? true : false;

    context.beginPath();

        // First draw the corners

        // Top left corner
        if (corner_tl) {
            context.moveTo(x + r, y + r);
            context.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
        } else {
            context.fillRect(x, y, r, r);
        }

        // Top right corner
        if (corner_tr) {
            context.moveTo(x + w - r, y + r);
            context.arc(x + w - r, y + r, r, 1.5 * Math.PI, 0, false);
        } else {
            context.moveTo(x + w - r, y);
            context.fillRect(x + w - r, y, r, r);
        }


        // Bottom right corner
        if (corner_br) {
            context.moveTo(x + w - r, y + h - r);
            context.arc(x + w - r, y - r + h, r, 0, Math.PI / 2, false);
        } else {
            context.moveTo(x + w - r, y + h - r);
            context.fillRect(x + w - r, y + h - r, r, r);
        }

        // Bottom left corner
        if (corner_bl) {
            context.moveTo(x + r, y + h - r);
            context.arc(x + r, y - r + h, r, Math.PI / 2, Math.PI, false);
        } else {
            context.moveTo(x, y + h - r);
            context.fillRect(x, y + h - r, r, r);
        }

        // Now fill it in
        context.fillRect(x + r, y, w - r - r, h);
        context.fillRect(x, y + r, w, h - r - r);

    context.fill();
}


/**
* A crude timing function
* 
* @param string label The label to use for the time
*/
RGraph.Timer = function (label)
{
    var d = new Date();

    // This uses the Firebug console
    console.log(label + ': ' + d.getSeconds() + '.' + d.getMilliseconds());
}


/**
* Hides the zoomed canvas
*/
RGraph.HideZoomedCanvas = function ()
{
    if (typeof(__zoomedimage__) == 'object') {
        obj = __zoomedimage__.obj;
    } else {
        return;
    }

    if (obj.Get('chart.zoom.fade.out')) {
        for (var i=10,j=1; i>=0; --i, ++j) {
            if (typeof(__zoomedimage__) == 'object') {
                setTimeout("__zoomedimage__.style.opacity = " + String(i / 10), j * 30);
            }
        }

        if (typeof(__zoomedbackground__) == 'object') {
            setTimeout("__zoomedbackground__.style.opacity = " + String(i / 10), j * 30);
        }
    }

    if (typeof(__zoomedimage__) == 'object') {
        setTimeout("__zoomedimage__.style.display = 'none'", obj.Get('chart.zoom.fade.out') ? 310 : 0);
    }

    if (typeof(__zoomedbackground__) == 'object') {
        setTimeout("__zoomedbackground__.style.display = 'none'", obj.Get('chart.zoom.fade.out') ? 310 : 0);
    }
}


/**
* This function returns the page width, accounting for browser differences.
* 
* @return int The page width
*/
RGraph.getPageWidth = function ()
{
    return document.body.clientWidth + 16;
}


/**
* This function returns the page heught, accounting for browser differences.
* 
* @return int The page height
*/
RGraph.getPageHeight = function ()
{
    // Chrome
    if (navigator.userAgent.indexOf('Chrome') != -1) {
        return Math.max(document.body.clientHeight, document.body.scrollHeight);

    // Safari
    } else if (navigator.userAgent.indexOf('Safari') != -1) {
        return Math.max(document.body.clientHeight, document.body.scrollHeight) + 40;

    // Opera
    } else if (navigator.userAgent.indexOf('Opera') != -1) {

        var height = Math.max(document.body.clientHeight, document.body.offsetHeight);
        height = Math.max(height, document.body.scrollHeight) + 40;

        return height;

    // MSIE
    } else if (navigator.userAgent.indexOf('MSIE') != -1) {
        return Math.max(document.body.scrollHeight, document.body.clientHeight) + 40;
    
    // Firefox and other
    } else {
        return Math.max(window.innerHeight, Math.max(document.body.clientHeight, document.body.scrollHeight)) + 40;
    }
}
/**
* o------------------------------------------------------------------------------o
* | This file is part of the RGraph package - you can learn more at:             |
* |                                                                              |
* |                          http://www.rgraph.net                               |
* |                                                                              |
* | This package is licensed under the RGraph license. For all kinds of business |
* | purposes there is a small one-time licensing fee to pay and for non          |
* | commercial  purposes it is free to use. You can read the full license here:  |
* |                                                                              |
* |                      http://www.rgraph.net/LICENSE.txt                       |
* o------------------------------------------------------------------------------o
*/

if (typeof(RGraph) == 'undefined') RGraph = {};

/**
* The line chart constructor
* 
* @param object canvas The cxanvas object
* @param array  data   The chart data
* @param array  ...    Other lines to plot
*/
RGraph.Line = function (id)
{
    // Get the canvas and context objects
    this.id      = id;
    this.canvas  = document.getElementById(id);
    this.context = this.canvas.getContext ? this.canvas.getContext("2d") : null;
    this.canvas.__object__ = this;
    this.type              = 'line';
    this.max               = 0;
    this.coords            = [];
    this.hasnegativevalues = false;


    /**
    * Compatibility with older browsers
    */
    RGraph.OldBrowserCompat(this.context);


    // Various config type stuff
    this.properties = {
        'chart.background.barcolor1':   'rgba(0,0,0,0)',
        'chart.background.barcolor2':   'rgba(0,0,0,0)',
        'chart.background.grid':        1,
        'chart.background.grid.width':  1,
        'chart.background.grid.hsize':  25,
        'chart.background.grid.vsize':  25,
        'chart.background.grid.color':  '#ddd',
        'chart.background.grid.vlines': true,
        'chart.background.grid.hlines': true,
        'chart.background.grid.border': true,
        'chart.background.hbars':       null,
        'chart.labels':                 null,
        'chart.labels.ingraph':         null,
        'chart.xtickgap':               20,
        'chart.smallxticks':            3,
        'chart.largexticks':            5,
        'chart.ytickgap':               20,
        'chart.smallyticks':            3,
        'chart.largeyticks':            5,
        'chart.linewidth':              1,
        'chart.colors':                 ['red', '#0f0', '#00f', '#f0f', '#ff0', '#0ff'],
        'chart.hmargin':                0,
        'chart.tickmarks.dot.color':    'white',
        'chart.tickmarks':              null,
        'chart.ticksize':               3,
        'chart.gutter':                 25,
        'chart.tickdirection':          -1,
        'chart.yaxispoints':            5,
        'chart.fillstyle':              null,
        'chart.xaxispos':               'bottom',
        'chart.yaxispos':               'left',
        'chart.xticks':                 null,
        'chart.text.size':              10,
        'chart.text.angle':             0,
        'chart.text.color':             'black',
        'chart.text.font':              'Verdana',
        'chart.ymin':                   null,
        'chart.ymax':                   null,
        'chart.title':                  '',
        'chart.title.vpos':             null,
        'chart.shadow':                 false,
        'chart.shadow.offsetx':         2,
        'chart.shadow.offsety':         2,
        'chart.shadow.blur':            3,
        'chart.shadow.color':           'rgba(0,0,0,0.5)',
        'chart.tooltips':               null,
        'chart.tooltip.effect':         'fade',
        'chart.stepped':                false,
        'chart.key':                    [],
        'chart.key.background':         'white',
        'chart.key.position':           'graph',
        'chart.key.shadow':             false,
        'chart.contextmenu':            null,
        'chart.ylabels':                true,
        'chart.ylabels.count':          5,
        'chart.noaxes':                 false,
        'chart.noxaxis':                false,
        'chart.noendxtick':             false,
        'chart.units.post':             '',
        'chart.units.pre':              '',
        'chart.scale.decimals':         0,
        'chart.crosshairs':             false,
        'chart.crosshairs.color':       '#333',
        'chart.annotatable':            false,
        'chart.annotate.color':         'black',
        'chart.axesontop':              false,
        'chart.filled.range':           false,
        'chart.variant':                null,
        'chart.axis.color':             'black',
        'chart.zoom.factor':            1.5,
        'chart.zoom.fade.in':           true,
        'chart.zoom.fade.out':          true,
        'chart.zoom.hdir':              'right',
        'chart.zoom.vdir':              'down',
        'chart.zoom.frames':            15,
        'chart.zoom.delay':             33,
        'chart.zoom.shadow':            true,
        'chart.zoom.mode':              'canvas',
        'chart.zoom.thumbnail.width':   75,
        'chart.zoom.thumbnail.height':  75,
        'chart.zoom.background':        true
    }

    /**
    * Change null arguments to empty arrays
    */
    for (var i=1; i<arguments.length; ++i) {
        if (typeof(arguments[i]) == 'null' || !arguments[i]) {
            arguments[i] = [];
        }
    }

    // Check the common library has been included
    if (typeof(RGraph) == 'undefined') {
        alert('[LINE] Fatal error: The common library does not appear to have been included');
    }

    // Store the original data
    this.original_data = [];

    for (var i=1; i<arguments.length; ++i) {
        this.original_data[i - 1] = RGraph.array_clone(arguments[i]);
    }

    // Check for support
    if (!this.canvas) {
        alert('[LINE] Fatal error: no canvas support');
        return;
    }
}


/**
* An all encompassing accessor
* 
* @param string name The name of the property
* @param mixed value The value of the property
*/
RGraph.Line.prototype.Set = function (name, value)
{
    // Consolidate the tooltips
    if (name == 'chart.tooltips') {
        this.properties['chart.tooltips'] = [];

        for (var i=1; i<arguments.length; i++) {
            for (j=0; j<arguments[i].length; j++) {
                this.Get('chart.tooltips').push(arguments[i][j]);
            }
        }
    }

    this.properties[name] = value;
}


/**
* An all encompassing accessor
* 
* @param string name The name of the property
*/
RGraph.Line.prototype.Get = function (name)
{
    return this.properties[name];
}


/**
* The function you call to draw the line chart
*/
RGraph.Line.prototype.Draw = function ()
{
    // Cache the gutter as an object variable
    this.gutter = this.Get('chart.gutter');

    // Reset the data back to that which was initially supplied
    this.data = RGraph.array_clone(this.original_data);


    // Reset the max value
    this.max = 0;

    /**
    * Reverse the datasets so that the data and the labels tally
    */
    this.data = RGraph.array_reverse(this.data);

    if (this.Get('chart.filled') && !this.Get('chart.filled.range') && this.data.length > 1) {
    
        var accumulation = [];
    
        for (var set=0; set<this.data.length; ++set) {
            for (var point=0; point<this.data[set].length; ++point) {
                this.data[set][point] = Number(accumulation[point] ? accumulation[point] : 0) + this.data[set][point];
                accumulation[point] = this.data[set][point];
            }
        }
    }

    /**
    * Get the maximum Y scale value
    */
    if (this.Get('chart.ymax')) {
        
        this.max = this.Get('chart.ymax');
        this.min = this.Get('chart.ymin') ? this.Get('chart.ymin') : 0;

        this.scale = [
                      ( ((this.max - this.min) * (1/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                      ( ((this.max - this.min) * (2/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                      ( ((this.max - this.min) * (3/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                      ( ((this.max - this.min) * (4/5)) + this.min).toFixed(this.Get('chart.scale.decimals')),
                      this.max.toFixed(this.Get('chart.scale.decimals'))
                     ];

    } else {
    
        this.min = this.Get('chart.ymin') ? this.Get('chart.ymin') : 0;

        // Work out the max Y value
        for (dataset=0; dataset<this.data.length; ++dataset) {
            for (var datapoint=0; datapoint<this.data[dataset].length; datapoint++) {

                this.max = Math.max(this.max, this.data[dataset][datapoint] ? Math.abs(parseFloat(this.data[dataset][datapoint])) : 0);

                // Check for negative values
                this.hasnegativevalues = (this.data[dataset][datapoint] < 0);
            }
        }

        // 20th April 2009 - moved out of the above loop
        this.scale = RGraph.getScale(Math.abs(parseFloat(this.max)));
        this.max   = this.scale[4] ? this.scale[4] : 0;
        
        if (this.Get('chart.ymin')) {
            this.scale[0] = ((this.max - this.Get('chart.ymin')) * (1/5)) + this.Get('chart.ymin');
            this.scale[1] = ((this.max - this.Get('chart.ymin')) * (2/5)) + this.Get('chart.ymin');
            this.scale[2] = ((this.max - this.Get('chart.ymin')) * (3/5)) + this.Get('chart.ymin');
            this.scale[3] = ((this.max - this.Get('chart.ymin')) * (4/5)) + this.Get('chart.ymin');
            this.scale[4] = ((this.max - this.Get('chart.ymin')) * (5/5)) + this.Get('chart.ymin');
        }

        if (this.Get('chart.scale.decimals')) {
            this.scale[0] = Number(this.scale[0]).toFixed(this.Get('chart.scale.decimals'));
            this.scale[1] = Number(this.scale[1]).toFixed(this.Get('chart.scale.decimals'));
            this.scale[2] = Number(this.scale[2]).toFixed(this.Get('chart.scale.decimals'));
            this.scale[3] = Number(this.scale[3]).toFixed(this.Get('chart.scale.decimals'));
            this.scale[4] = Number(this.scale[4]).toFixed(this.Get('chart.scale.decimals'));
        }
    }

    /**
    * Setup the context menu if required
    */
    RGraph.ShowContext(this);

    /**
    * Reset the coords array otherwise it will keep growing
    */
    this.coords = [];

    /**
    * Work out a few things. They need to be here because they depend on things you can change before you
    * call Draw() but after you instantiate the object
    */
    this.grapharea      = this.canvas.height - ( (2 * this.gutter));
    this.halfgrapharea  = this.grapharea / 2;
    this.halfTextHeight = this.Get('chart.text.size') / 2;

    // Check the combination of the X axis position and if there any negative values
    if (this.Get('chart.xaxispos') == 'bottom' && this.hasnegativevalues) {
        alert('[LINE] You have negative values and the X axis is at the bottom. This is not good...');
    }
    
    if (this.Get('chart.variant') == '3d') {
        RGraph.Draw3DAxes(this);
    }
    
    // Progressively Draw the chart
    RGraph.background.Draw(this);

    /**
    * Draw any horizontal bars that have been defined
    */
    if (this.Get('chart.background.hbars') && this.Get('chart.background.hbars').length > 0) {
        RGraph.DrawBars(this);
    }

    if (this.Get('chart.axesontop') == false) {
        this.DrawAxes();
    }

    for (var i=(this.data.length - 1), j=0; i>=0; i--, j++) {

        this.context.beginPath();

        /**
        * Turn on the shadow if required
        */
        if (this.Get('chart.shadow') && !this.Get('chart.filled')) {
            this.context.shadowColor   = this.Get('chart.shadow.color');
            this.context.shadowBlur    = this.Get('chart.shadow.blur');
            this.context.shadowOffsetX = this.Get('chart.shadow.offsetx');
            this.context.shadowOffsetY = this.Get('chart.shadow.offsety');
        
        } else if (this.Get('chart.filled') && this.Get('chart.shadow')) {
            alert('[LINE] Shadows are not permitted when the line is filled');
        }

        /**
        * Draw the line
        */

        if (this.Get('chart.fillstyle')) {
            if (typeof(this.Get('chart.fillstyle')) == 'object' && this.Get('chart.fillstyle')[j]) {
               var fill = this.Get('chart.fillstyle')[j];
            
            } else if (typeof(this.Get('chart.fillstyle')) == 'string') {
                var fill = this.Get('chart.fillstyle');

            } else {
                alert('[LINE] Warning: chart.fillstyle must be either a string or an array with the same number of elements as you have sets of data');
            }
        } else if (this.Get('chart.filled')) {
            var fill = this.Get('chart.colors')[j];

        } else {
            var fill = null;
        }

        this.DrawLine(this.data[i], this.Get('chart.colors')[j], fill);

        this.context.stroke();
    }


    /**
    * If the axes have been requested to be on top, do that
    */
    if (this.Get('chart.axesontop')) {
        this.DrawAxes();
    }
    /**
    * Draw the labels
    */
    this.DrawLabels();
    
    /**
    * Draw the range if necessary
    */
    this.DrawRange();
    
    // Draw a key if necessary
    if (this.Get('chart.key').length) {
        RGraph.DrawKey(this, this.Get('chart.key'), this.Get('chart.colors'));
    }


    /**
    * Draw the "in graph" labels
    */
    RGraph.DrawInGraphLabels(this);

    /**
    * Draw crosschairs
    */
    RGraph.DrawCrosshairs(this);
    
    /**
    * If the canvas is annotatable, do install the event handlers
    */
    RGraph.Annotate(this);
    
    /**
    * Redraw the lines if a filled range is on the cards
    */
    if (this.Get('chart.filled') && this.Get('chart.filled.range') && this.data.length == 2) {

        this.context.beginPath();
        var len = this.coords.length / 2;
        this.context.lineWidth = this.Get('chart.linewidth');
        this.context.strokeStyle = this.Get('chart.colors')[0];

        for (var i=0; i<len; ++i) {
            if (i == 0) {
                this.context.moveTo(this.coords[i][0], this.coords[i][1]);
            } else {
                this.context.lineTo(this.coords[i][0], this.coords[i][1]);
            }
        }
        
        this.context.stroke();


        this.context.beginPath();
        
        if (this.Get('chart.colors')[1]) {
            this.context.strokeStyle = this.Get('chart.colors')[1];
        }
        
        for (var i=this.coords.length - 1; i>=len; --i) {
            if (i == (this.coords.length - 1) ) {
                this.context.moveTo(this.coords[i][0], this.coords[i][1]);
            } else {
                this.context.lineTo(this.coords[i][0], this.coords[i][1]);
            }
        }
        
        this.context.stroke();
    } else if (this.Get('chart.filled') && this.Get('chart.filled.range')) {
        alert('[LINE] You must have only two sets of data for a filled range chart');
    }
    
    /**
    * This bit shows the mini zoom window if requested
    */
    RGraph.ShowZoomWindow(this);
}


/**
* Draws the axes
*/
RGraph.Line.prototype.DrawAxes = function ()
{
    var gutter = this.gutter;

    // Don't draw the axes?
    if (this.Get('chart.noaxes')) {
        return;
    }
    
    // Turn any shadow off
    RGraph.NoShadow(this);

    this.context.lineWidth   = 1;
    this.context.strokeStyle = this.Get('chart.axis.color');
    this.context.beginPath();

    // Draw the X axis
    if (this.Get('chart.noxaxis') == false) {
        if (this.Get('chart.xaxispos') == 'center') {
            this.context.moveTo(gutter, this.grapharea / 2 + gutter);
            this.context.lineTo(this.canvas.width - gutter, this.grapharea / 2 + gutter);
        } else {
            this.context.moveTo(gutter, this.canvas.height - gutter);
            this.context.lineTo(this.canvas.width - gutter, this.canvas.height - gutter);
        }
    }
    
    // Draw the Y axis
    if (this.Get('chart.yaxispos') == 'left') {
        this.context.moveTo(gutter, gutter);
        this.context.lineTo(gutter, this.canvas.height - (gutter) );
    } else {
        this.context.moveTo(this.canvas.width - gutter, gutter);
        this.context.lineTo(this.canvas.width - gutter, this.canvas.height - gutter );
    }
    
    /**
    * Draw the X tickmarks
    */
    if (this.Get('chart.noxaxis') == false) {
        var xTickInterval = (this.canvas.width - (2 * gutter)) / (this.Get('chart.xticks') ? this.Get('chart.xticks') : this.data[0].length);

        for (x=gutter + (this.Get('chart.yaxispos') == 'left' ? xTickInterval : 0); x<=(this.canvas.width - gutter + 1 ); x+=xTickInterval) {

            if (this.Get('chart.yaxispos') == 'right' && x >= (this.canvas.width - gutter - 1) ) {
                break;
            }
            
            // If the last tick is not desired...
            if (this.Get('chart.noendxtick')) {
                if (this.Get('chart.yaxispos') == 'left' && x >= (this.canvas.width - gutter)) {
                    break;
                } else if (this.Get('chart.yaxispos') == 'right' && x == gutter) {
                    continue;
                }
            }

            var yStart = this.Get('chart.xaxispos') == 'center' ? (this.canvas.height / 2) - 3 : this.canvas.height - gutter;
            var yEnd = this.Get('chart.xaxispos') == 'center' ? yStart + 6 : this.canvas.height - gutter - (x % 60 == 0 ? this.Get('chart.largexticks') * this.Get('chart.tickdirection') : this.Get('chart.smallxticks') * this.Get('chart.tickdirection'));

            this.context.moveTo(x, yStart);
            this.context.lineTo(x, yEnd);
        }
    }

    /**
    * Draw the Y tickmarks
    */
    var counter    = 0;
    var adjustment = 0;

    if (this.Get('chart.yaxispos') == 'right') {
        adjustment = (this.canvas.width - (2 * gutter));
    }

    if (this.Get('chart.xaxispos') == 'center') {
        var interval = (this.grapharea / 10);
        var lineto = (this.Get('chart.yaxispos') == 'left' ? gutter : this.canvas.width - gutter + this.Get('chart.smallyticks'));

        // Draw the upper halves Y tick marks
        for (y=gutter; y < (this.grapharea / 2) + gutter; y+=interval) {
            this.context.moveTo((this.Get('chart.yaxispos') == 'left' ? gutter - this.Get('chart.smallyticks') : this.canvas.width - gutter), y);
            this.context.lineTo(lineto, y);
        }
        
        // Draw the lower halves Y tick marks
        for (y=gutter + (this.halfgrapharea) + interval; y <= this.grapharea + gutter; y+=interval) {
            this.context.moveTo((this.Get('chart.yaxispos') == 'left' ? gutter - this.Get('chart.smallyticks') : this.canvas.width - gutter), y);
            this.context.lineTo(lineto, y);
        }

    } else {
        var lineto = (this.Get('chart.yaxispos') == 'left' ? gutter - this.Get('chart.smallyticks') : this.canvas.width - gutter + this.Get('chart.smallyticks'));

        for (y=gutter; y < (this.canvas.height - gutter) && counter < 10; y+=( (this.canvas.height - (2 * gutter)) / 10) ) {

            this.context.moveTo(gutter + adjustment, y);
            this.context.lineTo(lineto, y);
        
            var counter = counter +1;
        }
    }

    this.context.stroke();
}


/**
* Draw the text labels for the axes
*/
RGraph.Line.prototype.DrawLabels = function ()
{
    // Black text
    this.context.fillStyle = this.Get('chart.text.color');
    this.context.lineWidth = 1;
    
    // Turn off any shadow
    RGraph.NoShadow(this);

    // Draw the Y axis labels
    if (this.Get('chart.ylabels')) {

        var gutter     = this.Get('chart.gutter');
        var text_size  = this.Get('chart.text.size');
        var units_pre  = this.Get('chart.units.pre');
        var units_post = this.Get('chart.units.post');
        var context    = this.context;
        var xpos       = this.Get('chart.yaxispos') == 'left' ? gutter - 5 : this.canvas.width - gutter + 5;
        var align      = this.Get('chart.yaxispos') == 'left' ? 'right' : 'left';
        var font       = this.Get('chart.text.font');
        var numYLabels = this.Get('chart.ylabels.count');

        if (this.Get('chart.xaxispos') == 'center') {
            var half = this.grapharea / 2;

            //  Draw the upper halves labels
            RGraph.Text(context, font, text_size, xpos, gutter + ( (0/5) * half ) + this.halfTextHeight, RGraph.number_format(this.scale[4], units_pre, units_post), null, align);

            if (numYLabels == 5) {
                RGraph.Text(context, font, text_size, xpos, gutter + ( (1/5) * half ) + this.halfTextHeight, RGraph.number_format(this.scale[3], units_pre, units_post), null, align);
                RGraph.Text(context, font, text_size, xpos, gutter + ( (3/5) * half ) + this.halfTextHeight, RGraph.number_format(this.scale[1], units_pre, units_post), null, align);
            }

            if (numYLabels >= 3) {
                RGraph.Text(context, font, text_size, xpos, gutter + ( (2/5) * half ) + this.halfTextHeight, RGraph.number_format(this.scale[2], units_pre, units_post), null, align);
                RGraph.Text(context, font, text_size, xpos, gutter + ( (4/5) * half ) + this.halfTextHeight, RGraph.number_format(this.scale[0], units_pre, units_post), null, align);
            }
            
            //  Draw the lower halves labels
            if (numYLabels >= 3) {
                RGraph.Text(context, font, text_size, xpos, gutter + ( (6/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this.scale[0], units_pre, units_post), null, align);
                RGraph.Text(context, font, text_size, xpos, gutter + ( (8/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this.scale[2], units_pre, units_post), null, align);
            }

            if (numYLabels == 5) {
                RGraph.Text(context, font, text_size, xpos, gutter + ( (7/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this.scale[1], units_pre, units_post), null, align);
                RGraph.Text(context, font, text_size, xpos, gutter + ( (9/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format(this.scale[3], units_pre, units_post), null, align);
            }

            RGraph.Text(context, font, text_size, xpos, gutter + ( (10/5) * half ) + this.halfTextHeight, '-' + RGraph.number_format( (this.scale[4] == '1.0' ? '1.0' : this.scale[4]), units_pre, units_post), null, align);

            // Draw the lower limit if chart.ymin is specified
            if (typeof(this.Get('chart.ymin')) == 'number') {
                RGraph.Text(context,
                            font,
                            text_size,
                            xpos,
                            this.canvas.height / 2,
                            RGraph.number_format(this.Get('chart.ymin').toFixed(this.Get('chart.scale.decimals')), units_pre, units_post),
                            'center',
                            align);
            }

        } else {

            RGraph.Text(context, font, text_size, xpos, gutter + this.halfTextHeight + ((0/5) * (this.canvas.height - (2 * this.Get('chart.gutter')) ) ), RGraph.number_format(this.scale[4], units_pre, units_post), null, align);

            if (numYLabels == 5) {
                RGraph.Text(context, font, text_size, xpos, gutter + this.halfTextHeight + ((3/5) * (this.canvas.height - (2 * this.Get('chart.gutter')) ) ), RGraph.number_format(this.scale[1], units_pre, units_post), null, align);
                RGraph.Text(context, font, text_size, xpos, gutter + this.halfTextHeight + ((1/5) * (this.canvas.height - (2 * this.Get('chart.gutter')) ) ), RGraph.number_format(this.scale[3], units_pre, units_post), null, align);
            }

            if (numYLabels >= 3) {
                RGraph.Text(context, font, text_size, xpos, gutter + this.halfTextHeight + ((2/5) * (this.canvas.height - (2 * this.Get('chart.gutter')) ) ), RGraph.number_format(this.scale[2], units_pre, units_post), null, align);
                RGraph.Text(context, font, text_size, xpos, gutter + this.halfTextHeight + ((4/5) * (this.canvas.height - (2 * this.Get('chart.gutter')) ) ), RGraph.number_format(this.scale[0], units_pre, units_post), null, align);
            }
            
            // Draw the lower limit if chart.ymin is specified
            if (typeof(this.Get('chart.ymin')) == 'number') {
                RGraph.Text(context,
                            font,
                            text_size,
                            xpos,
                            this.canvas.height - gutter,
                            RGraph.number_format(this.Get('chart.ymin').toFixed(this.Get('chart.scale.decimals')), units_pre, units_post),
                            'center',
                            align);
            }
        }
    }

    // Draw the X axis labels
    if (this.Get('chart.labels')) {
        
        var yOffset = 13;

        /**
        * Text angle
        */
        var angle  = 0;
        var valign = null;
        var halign = 'center';

        if (this.Get('chart.text.angle') == 45 || this.Get('chart.text.angle') == 90) {
            angle   = -1 * this.Get('chart.text.angle');
            valign  = 'center';
            halign  = 'right';
            yOffset = 5
        }

        this.context.fillStyle = this.Get('chart.text.color');

        for (i=0; i<this.Get('chart.labels').length; ++i) {
            if (this.Get('chart.labels')[i] && this.coords[i][0]) {
                var labelX = this.coords[i][0];
                
                /**
                * Account for an unrelated number of labels
                */
                if (this.Get('chart.labels').length != this.data[0].length) {
                    labelX = this.gutter + this.Get('chart.hmargin') + ((this.canvas.width - (2 * this.gutter) - (2 * this.Get('chart.hmargin'))) * (i / (this.Get('chart.labels').length - 1)));
                }


                RGraph.Text(context, font,
                                      text_size,
                                      labelX,
                                      (this.canvas.height - gutter) + yOffset,
                                      String(this.Get('chart.labels')[i]),
                                      valign,
                                      halign,
                                      null,
                                      angle);
            }
        }
    }
    
    this.context.stroke();
}


/**
* Draws the line
*/
RGraph.Line.prototype.DrawLine = function (lineData, color, fill)
{
    var penUp = false;
    var yPos  = 0;
    var xPos  = 0;
    this.context.lineWidth = 1;
    var lineCoords = [];

    // Work out the X interval
    var xInterval = (this.canvas.width - (2 * this.Get('chart.hmargin')) - ( (2 * this.gutter)) ) / (lineData.length - 1);

    // Loop thru each value given plotting the line
    for (i=0; i<lineData.length; i++) {

        yPos  = this.canvas.height - ( ( (lineData[i] - (lineData[i] > 0 ?  this.Get('chart.ymin') : (-1 * this.Get('chart.ymin')) ) ) / (this.max - this.min) ) * ((this.canvas.height - (2 * this.gutter)) ));

        // Make adjustments depending on the X axis position
        if (this.Get('chart.xaxispos') == 'center') {
            yPos /= 2;
        } else if (this.Get('chart.xaxispos') == 'bottom') {
            yPos -= this.gutter; // Without this the line is out of place due to the gutter
        }
        
        // Null data points
        if (lineData[i] == null) {
            yPos = null;
        }
        // Not very noticeable, but it does have an effect
        // It's more noticeable with a thick linewidth
        this.context.lineCap  = 'round';
        this.context.lineJoin = 'round';

        // Plot the line if we're at least on the second iteration
        if (i > 0) {
            xPos = xPos + xInterval;
        } else {
            xPos = this.Get('chart.hmargin') + this.gutter;
        }

        /**
        * Add the coords to an array
        */
        this.coords.push([xPos, yPos]);
        lineCoords.push([xPos, yPos]);
    }

    this.context.stroke();
    
    /**
    * For IE only: Draw the shadow ourselves as ExCanvas doesn't produce shadows
    */
    if (document.all && this.Get('chart.shadow')) {
        this.DrawIEShadow(lineCoords);
    }

    /**
    * Now draw the actual line [FORMERLY SECOND]
    */

    this.context.beginPath();
    this.context.strokeStyle = fill;
    this.context.fillStyle   = fill;

    var isStepped = this.Get('chart.stepped');

    for (var i=0; i< lineCoords.length; ++i) {

        xPos = lineCoords[i][0];
        yPos = lineCoords[i][1];

        var prevY     = (lineCoords[i - 1] ? lineCoords[i - 1][1] : null);
        var isLast    = (i + 1) == lineCoords.length;

        if (i == 0 || penUp || !yPos || !prevY) {
            if (this.Get('chart.filled') && !this.Get('chart.filled.range')) {
                this.context.moveTo(xPos + 1, this.canvas.height - this.gutter - (this.Get('chart.xaxispos') == 'center' ? (this.canvas.height - (2 * this.gutter)) / 2 : 0) -1);
                this.context.lineTo(xPos + 1, yPos);

            } else {
                this.context.moveTo(xPos, yPos);
            }
            
            penUp = false;

        } else {
            if (isStepped) {
                this.context.lineTo(xPos, lineCoords[i - 1][1]);
            }

            if (yPos >= this.gutter && yPos <= (this.canvas.height - this.gutter)) {

                if (isLast && this.Get('chart.filled') && !this.Get('chart.filled.range') && this.Get('chart.yaxispos') == 'right') {
                    xPos -= 1;
                }


                // Added 8th September 2009
                if (!isStepped || !isLast) {
                    this.context.lineTo(xPos, yPos);
                }
                
                penUp = false;
            } else {
                penUp = true;
            }
        }
    }

    if (this.Get('chart.filled') && !this.Get('chart.filled.range')) {
        var fillStyle = this.Get('chart.fillstyle');

        this.context.lineTo(xPos, this.canvas.height - this.gutter - 1 -  + (this.Get('chart.xaxispos') == 'center' ? (this.canvas.height - (2 * this.gutter)) / 2 : 0));
        this.context.fillStyle = fill;

        this.context.fill();
    }


    this.context.stroke();

    // Now redraw the lines with the correct line width
    this.RedrawLine(lineCoords, color);
    
    this.context.stroke();

    // Draw the tickmarks
    for (var i=0; i<lineCoords.length; ++i) {

        i = Number(i);

        if (
            (
                this.Get('chart.tickmarks') != 'endcircle'
             && this.Get('chart.tickmarks') != 'endsquare'
             && this.Get('chart.tickmarks') != 'filledendsquare'
             && this.Get('chart.tickmarks') != 'endtick'
             && this.Get('chart.tickmarks') != 'arrow'
             && this.Get('chart.tickmarks') != 'filledarrow'
            )
            || (i == 0 && this.Get('chart.tickmarks') != 'arrow' && this.Get('chart.tickmarks') != 'filledarrow')
            || i == (lineCoords.length - 1)
           ) {

            var prevX = (i <= 0 ? null : lineCoords[i - 1][0]);
            var prevY = (i <= 0 ? null : lineCoords[i - 1][1]);
            this.DrawTick(lineCoords[i][0], lineCoords[i][1], color, false, prevX, prevY);

            if (this.Get('chart.stepped') && lineCoords[i + 1] && this.Get('chart.tickmarks') != 'endsquare' && this.Get('chart.tickmarks') != 'endcircle' && this.Get('chart.tickmarks') != 'endtick') {
                this.DrawTick(lineCoords[i + 1][0], lineCoords[i][1], color);
            }
        }
    }

    // Draw something off canvas to skirt an annoying bug
    this.context.beginPath();
    this.context.arc(this.canvas.width + 50, this.canvas.height + 50, 2, 0, 6.38, 1);


    /**
    * If TOOLTIPS are defined, handle them
    */
    if (this.Get('chart.tooltips') && this.Get('chart.tooltips').length) {
    
        // Need to register this object for redrawing
        RGraph.Register(this);

        this.canvas.onmousemove = function (e)
        {
            e = RGraph.FixEventObject(e);

            var canvas  = e.target;
            var context = canvas.getContext('2d');
            var obj     = canvas.__object__;

            RGraph.Register(obj);

            var mouseCoords = RGraph.getMouseXY(e);
            var mouseX      = mouseCoords[0];
            var mouseY      = mouseCoords[1];


            for (i=0; i<obj.coords.length; ++i) {
                
                var idx = i;
                var xCoord = obj.coords[i][0];
                var yCoord = obj.coords[i][1];
                if (
                       mouseX <= xCoord + 5
                    && mouseX >= xCoord - 5
                    && mouseY <= yCoord + 5
                    && mouseY >= yCoord - 5
                    && obj.Get('chart.tooltips')[i]
                   ) {
                    
                    // Chnage the pointer to a hand
                    canvas.style.cursor = document.all ? 'hand' : 'pointer';

                    /**
                    * If the tooltip is the same one as is currently visible (going by the array index), don't do squat and return.
                    */
                    if (RGraph.Registry.Get('chart.tooltip') && RGraph.Registry.Get('chart.tooltip').__index__ == idx) {
                        return;
                    }

                   // Redraw the graph
                    RGraph.Redraw();

                    // SHOW THE CORRECT TOOLTIP
                    RGraph.Tooltip(canvas, obj.Get('chart.tooltips')[idx], e.pageX, e.pageY);
                    
                    // Store the tooltip index on the tooltip object
                    RGraph.Registry.Get('chart.tooltip').__index__ = Number(idx);

                    // Draw a circle at the correct point
                    context.beginPath();
                    context.moveTo(xCoord, yCoord);
                    context.arc(xCoord, yCoord, 2, 0, 6.28, 0);
                    context.strokeStyle = '#999';
                    context.fillStyle = 'white';
                    context.stroke();
                    context.fill();
                    
                    e.stopPropagation = true;
                    e.cancelBubble = true;
                    return;
                }
            }
            
            /**
            * Not over a hotspot?
            */
            canvas.style.cursor = 'default';
        }

    // This resets the canvas events - getting rid of any installed event handlers
    } else {
        this.canvas.onmousemove = null;
    }
}


/**
* This functions draws a tick mark on the line
* 
* @param xPos  int  The x position of the tickmark
* @param yPos  int  The y position of the tickmark
* @param color str  The color of the tickmark
* @param       bool Whether the tick is a shadow. If it is, it gets offset by the shadow offset
*/
RGraph.Line.prototype.DrawTick = function (xPos, yPos, color, isShadow, prevX, prevY)
{
    var gutter = this.Get('chart.gutter');

    // If the yPos is null - no tick
    if (yPos == null || yPos > (this.canvas.height - gutter) || yPos < gutter) {
        return;
    }

    this.context.beginPath();

    var offset   = 0;

    // Reset the stroke and lineWidth back to the same as what they were when the line was drawm
    this.context.lineWidth   = this.Get('chart.linewidth');
    this.context.strokeStyle = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;
    this.context.fillStyle   = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;

    // Cicular tick marks
    if (   this.Get('chart.tickmarks') == 'circle'
        || this.Get('chart.tickmarks') == 'filledcircle'
        || this.Get('chart.tickmarks') == 'endcircle') {

        if (this.Get('chart.tickmarks') == 'circle'|| this.Get('chart.tickmarks') == 'filledcircle' || (this.Get('chart.tickmarks') == 'endcircle') ) {
            this.context.beginPath();
            this.context.arc(xPos + offset, yPos + offset, this.Get('chart.ticksize'), 0, 360 / (180 / Math.PI), false);

            if (this.Get('chart.tickmarks') == 'filledcircle') {
                this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;
            } else {
                this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : 'white';
            }

            this.context.fill();
            this.context.stroke();
        }

    // Halfheight "Line" style tick marks
    } else if (this.Get('chart.tickmarks') == 'halftick') {
        this.context.beginPath();
        this.context.moveTo(xPos, yPos);
        this.context.lineTo(xPos, yPos + this.Get('chart.ticksize'));

        this.context.stroke();
    
    // Tick style tickmarks
    } else if (this.Get('chart.tickmarks') == 'tick') {
        this.context.beginPath();
        this.context.moveTo(xPos, yPos -  this.Get('chart.ticksize'));
        this.context.lineTo(xPos, yPos + this.Get('chart.ticksize'));

        this.context.stroke();
    
    // Endtick style tickmarks
    } else if (this.Get('chart.tickmarks') == 'endtick') {
        this.context.beginPath();
        this.context.moveTo(xPos, yPos -  this.Get('chart.ticksize'));
        this.context.lineTo(xPos, yPos + this.Get('chart.ticksize'));

        this.context.stroke();
    
    // "Cross" style tick marks
    } else if (this.Get('tickmarks') == 'cross') {
        this.context.beginPath();
        this.context.moveTo(xPos - this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'));
        this.context.lineTo(xPos + this.Get('chart.ticksize'), yPos + this.Get('chart.ticksize'));
        this.context.moveTo(xPos + this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'));
        this.context.lineTo(xPos - this.Get('chart.ticksize'), yPos + this.Get('chart.ticksize'));
        
        this.context.stroke();
    
    // A white bordered circle
    } else if (this.Get('chart.tickmarks') == 'borderedcircle' || this.Get('chart.tickmarks') == 'dot') {
            this.context.lineWidth   = 1;
            this.context.strokeStyle = this.Get('chart.tickmarks.dot.color');
            this.context.fillStyle   = this.Get('chart.tickmarks.dot.color');

            // The outer white circle
            this.context.beginPath();
            this.context.arc(xPos, yPos, this.Get('chart.ticksize'), 0, 360 / (180 / Math.PI), false);
            this.context.closePath();


            this.context.fill();
            this.context.stroke();
            
            // Now do the inners
            this.context.beginPath();
            this.context.fillStyle   = color;
            this.context.strokeStyle = color;
            this.context.arc(xPos, yPos, this.Get('chart.ticksize') - 2, 0, 360 / (180 / Math.PI), false);

            this.context.closePath();

            this.context.fill();
            this.context.stroke();
    
    } else if (   this.Get('chart.tickmarks') == 'square'
               || this.Get('chart.tickmarks') == 'filledsquare'
               || (this.Get('chart.tickmarks') == 'endsquare')
               || (this.Get('chart.tickmarks') == 'filledendsquare') ) {

        this.context.fillStyle   = 'white';
        this.context.strokeStyle = this.context.strokeStyle; // FIXME Is this correct?

        this.context.beginPath();
        this.context.strokeRect(xPos - this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'), this.Get('chart.ticksize') * 2, this.Get('chart.ticksize') * 2);

        // Fillrect
        if (this.Get('chart.tickmarks') == 'filledsquare' || this.Get('chart.tickmarks') == 'filledendsquare') {
            this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : this.context.strokeStyle;
            this.context.fillRect(xPos - this.Get('chart.ticksize'), yPos - this.Get('chart.ticksize'), this.Get('chart.ticksize') * 2, this.Get('chart.ticksize') * 2);

        } else if (this.Get('chart.tickmarks') == 'square' || this.Get('chart.tickmarks') == 'endsquare') {
            this.context.fillStyle = isShadow ? this.Get('chart.shadow.color') : 'white';
            this.context.fillRect((xPos - this.Get('chart.ticksize')) + 1, (yPos - this.Get('chart.ticksize')) + 1, (this.Get('chart.ticksize') * 2) - 2, (this.Get('chart.ticksize') * 2) - 2);
        }

        this.context.stroke();
        this.context.fill();

    /**
    * FILLED arrowhead
    */
    } else if (this.Get('chart.tickmarks') == 'filledarrow') {
    
        var x = Math.abs(xPos - prevX);
        var y = Math.abs(yPos - prevY);

        if (yPos < prevY) {
            var a = Math.atan(x / y) + 1.57;
        } else {
            var a = Math.atan(y / x) + 3.14;
        }

        this.context.beginPath();
            this.context.moveTo(xPos, yPos);
            this.context.arc(xPos, yPos, 7, a - 0.5, a + 0.5, false);
        this.context.closePath();

        this.context.stroke();
        this.context.fill();

    /**
    * Arrow head, NOT filled
    */
    } else if (this.Get('chart.tickmarks') == 'arrow') {

        var x = Math.abs(xPos - prevX);
        var y = Math.abs(yPos - prevY);

        if (yPos < prevY) {
            var a = Math.atan(x / y) + 1.57;
        } else {
            var a = Math.atan(y / x) + 3.14;
        }

        this.context.beginPath();
            this.context.moveTo(xPos, yPos);
            this.context.arc(xPos, yPos, 7, a - 0.5 - (document.all ? 0.1 : 0), a - 0.4, false);

            this.context.moveTo(xPos, yPos);
            this.context.arc(xPos, yPos, 7, a + 0.5 + (document.all ? 0.1 : 0), a + 0.5, true);


        this.context.stroke();
    }
}


/**
* Draws a filled range if necessary
*/
RGraph.Line.prototype.DrawRange = function ()
{
    /**
    * Fill the range if necessary
    */
    if (this.Get('chart.filled.range') && this.Get('chart.filled')) {
        this.context.beginPath();
        this.context.fillStyle = this.Get('chart.fillstyle');
        this.context.strokeStyle = this.Get('chart.fillstyle');
        this.context.lineWidth = 1;
        var len = (this.coords.length / 2);

        for (var i=0; i<len; ++i) {
            if (i == 0) {
                this.context.moveTo(this.coords[i][0], this.coords[i][1])
            } else {
                this.context.lineTo(this.coords[i][0], this.coords[i][1])
            }
        }

        for (var i=this.coords.length - 1; i>=len; --i) {
            this.context.lineTo(this.coords[i][0], this.coords[i][1])
        }
        this.context.stroke();
        this.context.fill();
    }
}


/**
* Redraws the line with the correct line width etc
* 
* @param array coords The coordinates of the line
*/
RGraph.Line.prototype.RedrawLine = function (coords, color)
{
    this.context.beginPath();
    this.context.strokeStyle = (typeof(color) == 'object' && color ? color[0] : color);
    this.context.lineWidth = this.Get('chart.linewidth');

    var len    = coords.length;
    var gutter = this.gutter;

    for (var i=0; i<len; ++i) {
        var width  = this.canvas.width;
        var height = this.canvas.height;
        var xPos   = coords[i][0];
        var yPos   = coords[i][1];
        
        if (i > 0) {
            var prevX = coords[i - 1][0];
            var prevY = coords[i - 1][1];
        }

        if (
               (i == 0 && coords[i])
            || (yPos < gutter)
            || (yPos > (height - gutter) )
            || (i > 0 && prevX > (width - gutter) )
            || (i > 0 && prevY > (height - gutter) )
           ) {

            this.context.moveTo(coords[i][0], coords[i][1]);

        } else {

            if (this.Get('chart.stepped') && i > 0) {
                this.context.lineTo(coords[i][0], coords[i - 1][1]);
            }
            
            // Don't draw the last bit of a stepped chart
            if (!this.Get('chart.stepped') || i < (coords.length - 1)) {
                this.context.lineTo(coords[i][0], coords[i][1]);
            }
        }
    }


    /**
    * If two colors are specified instead of one, go over the up bits
    */
    if (this.Get('chart.colors.alternate') && typeof(color) == 'object' && color[0] && color[1]) {
        for (var i=1; i<len; ++i) {

            var prevX = coords[i - 1][0];
            var prevY = coords[i - 1][1];
            
            this.context.beginPath();
            this.context.strokeStyle = color[coords[i][1] < prevY ? 0 : 1];
            this.context.lineWidth = this.Get('chart.linewidth');
            this.context.moveTo(prevX, prevY);
            this.context.lineTo(coords[i][0], coords[i][1]);
            this.context.stroke();
        }
    }
}


/**
* This function is used by MSIE only to manually draw the shadow
* 
* @param array coords The coords for the line
*/
RGraph.Line.prototype.DrawIEShadow = function (coords)
{
    var offsetx = this.Get('chart.shadow.offsetx');
    var offsety = this.Get('chart.shadow.offsety');
    var color   = this.Get('chart.shadow.color');
    
    this.context.lineWidth = this.Get('chart.linewidth');
    this.context.strokeStyle = this.Get('chart.shadow.color');
    this.context.beginPath();

    for (var i=0; i<coords.length; ++i) {
        if (i == 0) {
            this.context.moveTo(coords[i][0] + offsetx, coords[i][1] + offsety);
        } else {
            this.context.lineTo(coords[i][0] + offsetx, coords[i][1] + offsety);
        }
    }

    this.context.stroke();
}