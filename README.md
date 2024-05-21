# jquery-autocompleter
A jQuery plugin autocomplete





## Installation
```code
	composer require gozoro/jquery-autocompleter
```

## Usage
-----

**Using an variant array**

```html



<input id="autocompleter" name="country" type="text" class="form-control"  value="" autocomplete="off" />
<script>
	$(document).ready(function()
	{
		var variants = [
			"Afghanistan",
			"Albania",
			"Algeria",
			"Andorra",
			"Angola",
			"Antigua and Barbuda",
			"Argentina",
			"Armenia",
			"Australia",
			"Austria",
			"Azerbaijan"
		];

		$("#autocompleter").autocompleter(variants);
	});
</script>';
```


| ![Example](https://raw.githubusercontent.com/gozoro/jquery-autocompleter/main/images/autocompleter.gif) |
|-|

**Using AJAX**

```html
<input id="autocompleter" name="city" type="text" class="form-control"  value=""/>
<script>
	$(document).ready(function()
	{
		var variants = "variants.php"; // script must be returns JSON with an variant array

		$("#autocompleter").autocompleter(variants);
	});
</script>';
```

## Options

#### maxResults
Maximum number of suggestions (0 - no limits). 

Default: 0.

#### minChars
Minimum number of characters for the suggestions. 

Default: 1.

#### timeout
Keyboard input timeout.

Default: 500 ms.


#### ajaxData
The function must return ajax-request data. Here you can get additional parameters for the ajax-request.

Default:
```javascript
function(value)
{
	return {value:value};
}
```

- `value` - input search value

#### template
The function must return the item value used to compare with the input value when filtering.
The result of the function determines the match of the input string.

Default:
```javascript
function(item, index)
{
	return item;
}
```
- `item` - item value of variant list.
- `index` - item key of variant list.


#### value
The function must return value for the request (when item is selected).
This option enables the use of hidden input.
You can use this option when you want to use an identifier instead of a text string from input.

Default: returned value of function from `template` option.

Example:
```javascript
function(item, index)
{
	return index;
}
```

- `item` - item value of variant list.
- `index` - item key of variant list.

#### hiddenDefaultValue
Default value for the hidden input. 

Default: "".



#### row
The function must return a value used for display a suggestions.
You can change the format of the output suggestion string.

Default:
```javascript
function(item, index)
{
	return item;
}
```

- `item` - item value of variant list.
- `index` - item key of variant list.

Example:
```javascript
function(item, index)
{
	return '<span style="red">' + item + '</span>';
}
```


#### filter
Function must return a boolean value. 
When a variant must be included in the list of suggestions this function must return `true` instead of `false`.

Default:
```javascript
function(item, index, searchValue, template)
{
	return template.match( RegExp('^'+searchValue.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'), 'i') );
}
```

- `item` - item value of variant list.
- `index` - item key of variant list.
- `searchValue` - current value of input.
- `template` - value of option `template`.


## Events

#### autocompleter.select

The event is triggered when an item from the list of variants is selected.


#### autocompleter.unselect

The event is triggered when an item from the list of variants is unselected.

Example:

```html
<style>

.form-control.success{
	border-color: #3c763d;
	background-color: #dff0d8;
}
</style>


<input id="autocompleter" name="country" type="text" class="form-control"  value="" autocomplete="off" />
<script>
$(document).ready(function()
{
	var variants = [
		"Afghanistan",
		"Albania",
		"Algeria",
		"Andorra",
		"Angola",
		"Antigua and Barbuda",
		"Argentina",
		"Armenia",
		"Australia",
		"Austria",
		"Azerbaijan"
	];

	$("#autocompleter").autocompleter(variants)
	.on('autocompleter.select', function(event, data)
	{
		$(this).addClass('success');
		console.log('selected:', data.value, data.template);

	})
	.on('autocompleter.unselect', function(event){
		$(this).removeClass('success');
	});
});
</script>';
```

| ![Example](https://raw.githubusercontent.com/gozoro/jquery-autocompleter/main/images/autocompleter.events.gif) |
|-|