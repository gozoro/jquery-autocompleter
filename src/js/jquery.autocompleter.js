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


	$.fn.autocompleter = function(variants, options)
	{
		options = $.extend({
            maxResults: 0,
			minChars: 1,
			timeout: 500,
			ajaxData: function(value){return {value:value};},
			hiddenDefaultValue: '',

			row:     function(item, index){return item;},
			value:   null,

			matchValue:  function(item, index){return item;},

			filter: function(item, index, searchValue, matchValue){
				return matchValue.match( RegExp('^'+searchValue.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'), 'i') );
			}

        }, options);

		var _this = this;


		return this.each(function()
		{
			var mouseLock            = false;
			var dropdownListVisible = false;
			var useHiddenInput  = (typeof options['value'] == 'function');
			var $searchInput    = $(this);
			var oldValue        = $searchInput.val().trim();
			var hiddenValue     = options['hiddenDefaultValue'];
			var $hiddenInput    = $('<input type="hidden" value="'+hiddenValue+'">');
			var $dropdownList   = $('<div class="multiselect-dropdownlist">');

			$searchInput.after($dropdownList);



			function reposition()
			{
				var pos = $searchInput.position();

				$dropdownList.css({
					left: pos.left,
					top: pos.top + $searchInput.outerHeight(),
					width: $searchInput.outerWidth()
				});
			}

			window.addEventListener('resize', reposition);
			document.fonts.ready.then(reposition);

			reposition();



			if(useHiddenInput)
			{
				$hiddenInput.attr('name', $searchInput.attr('name') );
				$searchInput.removeAttr('name').after($hiddenInput);
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
				_this.trigger('resultShow', {});
			}

			$dropdownList.hide = function()
			{
				$.fn.hide.apply(this, arguments);

				dropdownListVisible = false;
				_this.trigger('resultHide', {});
			}




			$dropdownList.mouseout(function()
			{
				if(!mouseLock)
					$dropdownList.unselect();
			});


			$searchInput.select = function($row)
			{
				$dropdownList.unselect().empty();

				if(useHiddenInput)
					$hiddenInput.val( $row.data('value') );

				var matchValue = $row.data('match-value');
				$searchInput.val( matchValue );
				oldValue = matchValue;


				return this;
			}


			$dropdownList.addItem = function(item, itemIndex)
			{
				var matchValue = options['matchValue'](item, itemIndex);
				var value = useHiddenInput ? options['value'](item, itemIndex) : matchValue;

				var $row = $('<div class="autocompleter-item">')
							.attr('data-match-value', matchValue)
							.attr('data-value', value)
							.html( options['row'](item, itemIndex) )
							.mousedown(function(event)
							{

								event.preventDefault(); // This prevents the element from being hidden by .blur before it's clicked

								$searchInput.select($row);
								$dropdownList.hide();
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
							})
							;

							$dropdownList.append($row);
			}


			$searchInput.click(function()
			{
				search( $searchInput.val(), 1);
			})
			.blur(function()
			{
				$dropdownList.hide();
			})
			.on('paste', function(event)
			{
				search( event.originalEvent.clipboardData.getData('text'), 1);
			})
			.keyup(function()
			{
				inputDelay(function()
				{
					search( $searchInput.val() );
				});
			})
			.keydown(function(event)
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
					$searchInput.select($row);

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





			var locks = [];
			function inputDelay(callback)
			{
				locks.push(1);
				setTimeout(function()
				{
					locks.pop();
					if(!locks.length)
					{
						callback();
					}
				}, options['timeout']);
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
				oldValue = value;
				$dropdownList.empty();

				if(!value || value.length < options['minChars'])
				{
					$dropdownList.hide();
					return;
				}

				_this.trigger('beforeSearch', {val:value});

				if(variants.constructor.name == 'String')
				{
					$.get(variants, options['ajaxData'](value), function(response){ filtering(value, response); });
				}
				else
				{

					filtering(value, variants);
				}
			}


			function filtering(searchValue, variants)
			{
				var i = 0;
				for(var itemIndex in variants)
				{
					var item = variants[itemIndex];
					var matchValue = options['matchValue'](item, itemIndex);

					if( options['filter'](item, itemIndex, searchValue, matchValue) && (options['maxResults'] <= 0 || i < options['maxResults']) )
					{
						var value = useHiddenInput ? options['value'](item, itemIndex) : matchValue;

						if(matchValue === searchValue)
							$hiddenInput.val(value);

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