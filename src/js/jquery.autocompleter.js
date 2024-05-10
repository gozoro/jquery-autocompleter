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
		var defaultMatchValue = function(item, index){return item;}

		options = $.extend({
            maxResults: 0,
			minChars: 1,
			timeout: 500,
			matchRegexp: function(value, escape){return RegExp(escape(value), 'i')},
			matchValue:  defaultMatchValue,
			itemDisplay: options['matchValue'] || defaultMatchValue,
			itemValue:   null,
			hiddenValue: '',
			emptyValue: '',
			ajaxData: function(value){return {value:value};}
        }, options);

		//TODO:: selection locking

		var _this = this;


		return this.each(function()
		{
			var mouseLock            = false;
			var dropdownListVisible = false;
			var useHiddenInput  = (typeof options['itemValue'] == 'function');
			var $searchInput    = $(this);
			var oldValue        = $searchInput.val().trim();
			var hiddenValue     = options['hiddenValue'] || options['emptyValue'];
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

			$searchInput.blur(function()
			{
				$dropdownList.hide();
			});

			$searchInput.click(function()
			{
				search( $searchInput.val(), 1);
			});

			$searchInput.on('paste', function(event)
			{
				search( event.originalEvent.clipboardData.getData('text'), 1);
			});


			$dropdownList.mouseout(function()
			{
				if(!mouseLock)
				{
					$dropdownList.unselect();
				}
			});

			$dropdownList.reselect = function(row)
			{
				mouseLock = false;
				$dropdownList.unselect();
				$(row).addClass('selected');
			}

			$dropdownList.addResultItem = function(item, itemIndex)
			{
				var matchValue = options['matchValue'](item, itemIndex);

				if(useHiddenInput)
				{
					var itemValue = options['itemValue'](item, itemIndex);
				}
				else
				{
					var itemValue = matchValue;
				}

				var resultRow = $('<div>').addClass('autocompleter-item')
							.attr('data-match-value', matchValue)
							.attr('data-value', itemValue)
							.html( options['itemDisplay'](item, itemIndex) )
							.mousedown(function(event)
							{
								event.preventDefault(); // This prevents the element from being hidden by .blur before it's clicked
							})
							.click(function()
							{
								$dropdownList.selectVariant($(this)).hide();
							})
							.mouseover(function()
							{
								if(!mouseLock)
								{
									$dropdownList.reselect(this);
								}
							})
							.mousemove(function()
							{
								if(mouseLock)
								{
									$dropdownList.reselect(this);
								}
							})
							;

							$dropdownList.append(resultRow);
			}

			$searchInput.keyup(function()
			{
				inputDelay(function()
				{
					search( $searchInput.val() );
				});
			});

			$searchInput.keydown(function(event)
			{
				switch(event.which)
				{
					case 38: pressUpArrow(event); return;
					case 40: pressDownArrow(event); return;
					case 13: pressEnter(event); return;
					case 27: pressEsc(event); return;
				}
			});

			$dropdownList.selectVariant = function(variant)
			{
				var matchValue = variant.data('match-value');
				var itemValue = variant.data('value');

				if(useHiddenInput)
					$hiddenInput.val(itemValue);

				$searchInput.val( matchValue );
				oldValue = matchValue;
				$dropdownList.empty();

				return this;
			}

			function pressEsc(event)
			{
				$dropdownList.hide();
			}

			function pressEnter(event)
			{
				event.preventDefault();

				var selectedVariant = $dropdownList.find('.selected').first();

				if(selectedVariant.length)
				{
					$dropdownList.unselect().selectVariant(selectedVariant);
				}

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


			function escapeRegExp(str)
			{
				return str.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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

				$hiddenInput.val(options['emptyValue']);
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


			function filtering(value, variants)
			{
				var regexp = options['matchRegexp'](value, escapeRegExp);
				var fullregexp = RegExp('^'+escapeRegExp(value)+'$', regexp.flags);
				var i = 0;

				for(var itemIndex in variants)
				{
					var item = variants[itemIndex];
					var matchValue = options['matchValue'](item, itemIndex);

					if(useHiddenInput)
						var itemValue = options['itemValue'](item, itemIndex);
					else
						var itemValue = matchValue;

					if(matchValue.match(fullregexp))
						$hiddenInput.val(itemValue);

					if(matchValue.match(regexp) && (options['maxResults'] <= 0 || i < options['maxResults']))
					{
						$dropdownList.addResultItem(item, itemIndex);
						i++
					}
				}

				_this.trigger('afterSearch', {});

				if($dropdownList.children().length)
					$dropdownList.show();
				else
					$dropdownList.hide();
			}
		}); // end each
	};
}(jQuery));