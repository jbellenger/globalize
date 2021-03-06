define([
	"./compact-pattern-re",
	"./format/grouping-separator",
	"./format/integer-fraction-digits",
	"./format/significant-digits",
	"./pattern-re",
	"../util/remove-literal-quotes"
], function( numberCompactPatternRe, numberFormatGroupingSeparator,
  numberFormatIntegerFractionDigits, numberFormatSignificantDigits, numberPatternRe,
  removeLiteralQuotes ) {

/**
 * format( number, properties )
 *
 * @number [Number].
 *
 * @properties [Object] Output of number/format-properties.
 *
 * Return the formatted number.
 * ref: http://www.unicode.org/reports/tr35/tr35-numbers.html
 */
return function( number, properties, pluralGenerator ) {
	var infinitySymbol, maximumFractionDigits, maximumSignificantDigits, minimumFractionDigits,
	minimumIntegerDigits, minimumSignificantDigits, nanSymbol, nuDigitsMap, padding, prefix,
	primaryGroupingSize, pattern, ret, round, roundIncrement, secondaryGroupingSize, suffix,
	symbolMap, compactMap;

	padding = properties[ 1 ];
	minimumIntegerDigits = properties[ 2 ];
	minimumFractionDigits = properties[ 3 ];
	maximumFractionDigits = properties[ 4 ];
	minimumSignificantDigits = properties[ 5 ];
	maximumSignificantDigits = properties[ 6 ];
	roundIncrement = properties[ 7 ];
	primaryGroupingSize = properties[ 8 ];
	secondaryGroupingSize = properties[ 9 ];
	round = properties[ 15 ];
	infinitySymbol = properties[ 16 ];
	nanSymbol = properties[ 17 ];
	symbolMap = properties[ 18 ];
	nuDigitsMap = properties[ 19 ];
	compactMap = properties[ 20 ];

	// NaN
	if ( isNaN( number ) ) {
		return nanSymbol;
	}

	if ( number < 0 ) {
		pattern = properties[ 12 ];
		prefix = properties[ 13 ];
		suffix = properties[ 14 ];
	} else {
		pattern = properties[ 11 ];
		prefix = properties[ 0 ];
		suffix = properties[ 10 ];
	}

	// Infinity
	if ( !isFinite( number ) ) {
		return prefix + infinitySymbol + suffix;
	}

	// Percent
	if ( pattern.indexOf( "%" ) !== -1 ) {
		number *= 100;

	// Per mille
	} else if ( pattern.indexOf( "\u2030" ) !== -1 ) {
		number *= 1000;
	}

	var compactPattern, compactDigits, compactProperties, divisor, pluralForm, rounded;
	if ( compactMap ) {
		var zeroes = Array( Math.floor( number ).toString().length ).join( "0" );
		if ( zeroes.length >= 3 ) {

			// use default plural form to perform initial decimal shift
			compactPattern = compactMap[ "1" + zeroes + "-count-other" ];
			compactDigits = compactPattern.split( "0" ).length - 1;
			divisor = zeroes.length - ( compactDigits - 1 );
			number = number / Math.pow( 10, divisor );

			// calculate rounded value to determine plural form and extract correct pattern
			rounded = parseInt( numberFormatIntegerFractionDigits( number, minimumIntegerDigits,
				minimumFractionDigits, maximumFractionDigits, round, roundIncrement ) );
			pluralForm = pluralGenerator ? pluralGenerator( rounded ) : "other";
			compactPattern = compactMap[ "1" + zeroes + "-count-" + pluralForm ] || compactPattern;
			compactProperties = compactPattern.match( numberCompactPatternRe );

			// update prefix/suffix with compact prefix/suffix
			prefix += compactProperties[ 1 ];
			suffix = compactProperties[ 11 ] + suffix;
		}
	}

	// Significant digit format
	if ( !isNaN( minimumSignificantDigits * maximumSignificantDigits ) ) {
		number = numberFormatSignificantDigits( number, minimumSignificantDigits,
			maximumSignificantDigits, round );

	// Integer and fractional format
	} else {
		number = numberFormatIntegerFractionDigits( number, minimumIntegerDigits,
			minimumFractionDigits, maximumFractionDigits, round, roundIncrement );
	}

	// Remove the possible number minus sign
	number = number.replace( /^-/, "" );

	// Grouping separators
	if ( primaryGroupingSize ) {
		number = numberFormatGroupingSeparator( number, primaryGroupingSize,
			secondaryGroupingSize );
	}

	ret = prefix;

	ret += number;

	// Scientific notation
	// TODO implement here

	// Padding/'([^']|'')+'|''|[.,\-+E%\u2030]/g
	// TODO implement here

	ret += suffix;

	return ret.replace( /('([^']|'')+'|'')|./g, function( character, literal ) {

		// Literals
		if ( literal ) {
			return removeLiteralQuotes( literal );
		}

		// Symbols
		character = character.replace( /[.,\-+E%\u2030]/, function( symbol ) {
			return symbolMap[ symbol ];
		});

		// Numbering system
		if ( nuDigitsMap ) {
			character = character.replace( /[0-9]/, function( digit ) {
				return nuDigitsMap[ +digit ];
			});
		}

		return character;
	});
};

});
