/**
 * A jQuery plugin autocomplete
 * @author Gozoro <gozoro@yandex.ru>
 *
 */

;(function($)
{
	'use strict';

	if(typeof($) == 'undefined')
	{
		console.warn('Required jQuery.');
		return;
	}


	$.fn.autocompleter = function(items, options)
	{
		var defaultRow = function(item, index){return item;}

		options = options || {};

		options = $.extend({
            maxResults: 0,
			minChars: 1,
			delay: 500,
			ajaxData: function(value){return {value:value};},
			hiddenDefaultValue: '',
			value: null,
			template: function(item, index){return item;},
			row: options['template'] || defaultRow,

			filter: function(item, index, inputValue, template){
				return ~template.toLowerCase().indexOf(inputValue.toLowerCase());
			}

        }, options);


		return this.each(function()
		{
			var mouseLock           = false;
			var dropdownListVisible = false;
			var useHiddenInput      = (typeof options['value'] == 'function');
			var $input              = $(this);
			var oldValue            = $input.val().trim();
			var hiddenValue         = options['hiddenDefaultValue'];
			var $hiddenInput        = $('<input type="hidden" value="'+hiddenValue+'">');
			var $dropdownList       = $('<div class="multiselect-dropdownlist">');

			function reposition()
			{
				var pos = $input.position();

				$dropdownList.css({
					left: pos.left,
					top: pos.top + $input.outerHeight(),
					width: $input.outerWidth()
				});
			}

			window.addEventListener('resize', reposition);
			document.fonts.ready.then(reposition);

			reposition();



			if(useHiddenInput)
			{
				$hiddenInput.attr('name', $input.attr('name') );
				$input.removeAttr('name').after($hiddenInput);
			}

			$dropdownList.unselect = function()
			{
				$dropdownList.find('.selected').removeClass('selected');
				return this;
			}

			$dropdownList.show = function()
			{
				$.fn.show.apply(this, arguments);

				dropdownListVisible = true;
				$dropdownList.unselect().scrollTop(0).children().first().addClass('selected');
			}

			$dropdownList.hide = function()
			{
				$.fn.hide.apply(this, arguments);

				dropdownListVisible = false;
			}

			$dropdownList.mouseout(function()
			{
				if(!mouseLock)
					$dropdownList.unselect();
			});

			$dropdownList.select = function($row)
			{
				$dropdownList.unselect().empty();
				var template = $row.data('template');
				oldValue = template;
				$input.selected($row.data('value'), template).val( template );
				return this;
			}

			$dropdownList.addItem = function(item, itemIndex)
			{
				var template = options['template'](item, itemIndex);
				var value = useHiddenInput ? options['value'](item, itemIndex) : template;

				var $row = $('<div class="autocompleter-item">')
							.attr('data-template', template)
							.attr('data-value', value)
							.html( options['row'](item, itemIndex) )
							.mousedown(function(event)
							{
								event.preventDefault(); // This prevents the element from being hidden by .blur before it's clicked
								$dropdownList.select($row).hide();
							})
							.mouseover(function()
							{
								if(!mouseLock)
								{
									mouseLock = false;
									$dropdownList.unselect();
									$row.addClass('selected');
								}
							})
							.mousemove(function()
							{
								if(mouseLock)
								{
									mouseLock = false;
									$dropdownList.unselect();
									$row.addClass('selected');
								}
							});

				$dropdownList.append($row);
			}

			$input.selected = function(value, template)
			{
				if(useHiddenInput)
					$hiddenInput.val(value);

				if(!$input.hasClass('selected'))
					$input.addClass('selected').trigger('autocompleter:select', {value:value, template:template});
				return this;
			}

			var namespace = '.autocompleter';

			$input.after($dropdownList)
			.on('click'+namespace, function()
			{
				search( $input.val(), 1);
			})
			.on('blur'+namespace, function()
			{
				$dropdownList.hide();
			})
			.on('paste'+namespace, function(event)
			{
				search( event.originalEvent.clipboardData.getData('text'), 1);
			})
			.on('keyup'+namespace, function()
			{
				inputDelay(function()
				{
					search( $input.val() );
				});
			})
			.on('keydown'+namespace, function(event)
			{
				switch(event.which)
				{
					case 38: pressUpArrow(event); return;
					case 40: pressDownArrow(event); return;
					case 13: pressEnter(event); return;
					case 27: pressEsc(event); return;
				}
			});


			function pressEsc(event)
			{
				$dropdownList.hide();
			}

			function pressEnter(event)
			{
				event.preventDefault();

				var $row = $dropdownList.find('.selected').first();

				if($row.length)
					$dropdownList.select($row);

				$dropdownList.hide();
			}

			function pressUpArrow(event)
			{
				if(dropdownListVisible)
				{
					event.preventDefault();
					mouseLock = true;
					var $selectedItem = $dropdownList.find('.selected').first();

					if($selectedItem.length)
					{
						$dropdownList.unselect();

						var $prevItem = $selectedItem.prev();

						if($prevItem.length)
						{
							var itemTop = $prevItem.addClass('selected').position().top ;
							var offset  = $dropdownList.position().top - $prevItem.innerHeight();

							if(itemTop < offset)
							{
								$dropdownList.scrollTop( $dropdownList.scrollTop() + offset + itemTop );
							}
							return;
						}
					}

					$dropdownList.scrollTop( $dropdownList.get(0).scrollHeight ).children().last().addClass('selected');
				}
			}

			function pressDownArrow()
			{
				if(dropdownListVisible)
				{
					mouseLock = true;
					var $selectedItem = $dropdownList.find('.selected').first();

					if($selectedItem.length)
					{
						$dropdownList.unselect();

						var $nextItem = $selectedItem.next();

						if($nextItem.length)
						{
							var panelHeight = $dropdownList.outerHeight() ;
							var itemHeight  = $nextItem.addClass('selected').innerHeight();
							var itemBottom  = $nextItem.position().top + itemHeight;

							if(itemBottom > panelHeight)
							{
								$dropdownList.scrollTop( $dropdownList.scrollTop() + itemHeight - $dropdownList.position().top - panelHeight + itemBottom );
							}
							return;
						}
					}

					$dropdownList.scrollTop( 0 ).children().first().addClass('selected');
				}
				else
				{
					if($dropdownList.children().length)
					{
						$dropdownList.show();
					}
				}
			}

			function inputDelay(callback)
			{
				var locks = [];
				locks.push(1);
				setTimeout(function()
				{
					locks.pop();
					if(!locks.length)
					{
						callback();
					}
				}, options['delay']);
			}

			function search(value, forceShow)
			{
				value = value.trim();

				if(value === oldValue)
				{
					if(forceShow && $dropdownList.children().length)
					{
					    $dropdownList.show();
					}

					return;
				}

				$hiddenInput.val(options['hiddenDefaultValue']);

				if($input.hasClass('selected'))
				{
					$input.removeClass('selected').trigger('autocompleter:unselect');
				}

				oldValue = value;
				$dropdownList.empty();

				if(!value || value.length < options['minChars'])
				{
					$dropdownList.hide();
					return;
				}

				if(items.constructor.name == 'String')
				{
					$.get(items, options['ajaxData'](value), function(response){ filtering(value, response); });
				}
				else
				{

					filtering(value, items);
				}
			}

			function filtering(searchValue, items)
			{
				var i = 0;
				for(var itemIndex in items)
				{
					var item = items[itemIndex];
					var template = options['template'](item, itemIndex);

					if( options['filter'](item, itemIndex, searchValue, template) && (options['maxResults'] <= 0 || i < options['maxResults']) )
					{
						var value = useHiddenInput ? options['value'](item, itemIndex) : template;

						if(template === searchValue)
							$input.selected(value, template);

						$dropdownList.addItem(item, itemIndex);
						i++;
					}
				}

				if($dropdownList.children().length)
					$dropdownList.show();
				else
					$dropdownList.hide();
			}
		}); // end each
	};
}(jQuery));