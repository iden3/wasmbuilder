/*
    Copyright 2019 0KIMS association.

    This file is part of wasmbuilder

    wasmbuilder is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    wasmbuilder is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with wasmbuilder. If not, see <https://www.gnu.org/licenses/>.
*/

export function toNumber(n) {
    return BigInt(n);
}

export function isNegative(n) {
    return n < BigInt(0);
}

export function isZero(n) {
    return n === BigInt(0);
}

export function bitLength(n) {
    if (isNegative(n)) {
        return n.toString(2).length - 1; // discard the - sign
    } else {
        return n.toString(2).length;
    }
}

export function u32(n) {
    const b = [];
    const v = toNumber(n);
    b.push(Number(v & BigInt(0xFF)));
    b.push(Number(v >> BigInt(8) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(16) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(24) & BigInt(0xFF)));
    return b;
}

export function u64(n) {
    const b = [];
    const v = toNumber(n);
    b.push(Number(v & BigInt(0xFF)));
    b.push(Number(v >> BigInt(8) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(16) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(24) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(32) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(40) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(48) & BigInt(0xFF)));
    b.push(Number(v >> BigInt(56) & BigInt(0xFF)));
    return b;
}

export function toUTF8Array(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode>>6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18),
                0x80 | ((charcode>>12) & 0x3f),
                0x80 | ((charcode>>6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

export function string(str) {
    const bytes = toUTF8Array(str);
    return [ ...varuint32(bytes.length), ...bytes ];
}

export function varuint(n) {
    const code = [];
    let v = toNumber(n);
    if (isNegative(v)) throw new Error("Number cannot be negative");
    while (!isZero(v)) {
        code.push(Number(v & BigInt(0x7F)));
        v = v >> BigInt(7);
    }
    if (code.length==0) code.push(0);
    for (let i=0; i<code.length-1; i++) {
        code[i] = code[i] | 0x80;
    }
    return code;
}

export function varint(_n) {
    let n, sign;
    const bits = bitLength(_n);
    if (_n<0) {
        sign = true;
        n = (BigInt(1) << BigInt(bits)) + _n;
    } else {
        sign = false;
        n = toNumber(_n);
    }
    const paddingBits = 7 - (bits % 7);

    const padding = ((BigInt(1) << BigInt(paddingBits)) - BigInt(1)) << BigInt(bits);
    const paddingMask = ((1 << (7 - paddingBits))-1) | 0x80;

    const code = varuint(n + padding);

    if (!sign) {
        code[code.length-1] = code[code.length-1] & paddingMask;
    }

    return code;
}

export function varint32(n) {
    let v = toNumber(n);
    if (v > BigInt(0xFFFFFFFF)) throw new Error("Number too big");
    if (v > BigInt(0x7FFFFFFF)) v = v - BigInt(0x100000000);
    // bigInt("-80000000", 16) as base10
    if (v < BigInt(-2147483648)) throw new Error("Number too small");
    return varint(v);
}

export function varint64(n) {
    let v = toNumber(n);
    if (v > BigInt("0xFFFFFFFFFFFFFFFF")) throw new Error("Number too big");
    if (v > BigInt("0x7FFFFFFFFFFFFFFF")) v = v - BigInt("0x10000000000000000");
    // bigInt("-8000000000000000", 16) as base10
    if (v < BigInt("-9223372036854775808")) throw new Error("Number too small");
    return varint(v);
}

export function varuint32(n) {
    let v = toNumber(n);
    if (v > BigInt(0xFFFFFFFF)) throw new Error("Number too big");
    return varuint(v);
}

export function varuint64(n) {
    let v = toNumber(n);
    if (v > BigInt("0xFFFFFFFFFFFFFFFF")) throw new Error("Number too big");
    return varuint(v);
}

export function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ("0" + (byte & 0xFF).toString(16)).slice(-2);
    }).join("");
}

export function ident(text) {
    if (typeof text === "string") {
        let lines = text.split("\n");
        for (let i=0; i<lines.length; i++) {
            if (lines[i]) lines[i] = "    "+lines[i];
        }
        return lines.join("\n");
    } else if (Array.isArray(text)) {
        for (let i=0; i<text.length; i++ ) {
            text[i] = ident(text[i]);
        }
        return text;
    }
}
