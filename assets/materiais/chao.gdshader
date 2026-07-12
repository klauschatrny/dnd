shader_type spatial;
// Chão variado do jardim (graybox art): mistura terra/grama/musgo por ruído
// espacial em coordenadas de mundo. Sem textura — tudo procedural.

uniform vec3 cor_terra : source_color = vec3(0.31, 0.29, 0.23);
uniform vec3 cor_grama : source_color = vec3(0.25, 0.30, 0.19);
uniform vec3 cor_musgo : source_color = vec3(0.20, 0.25, 0.18);
uniform float escala = 0.06;      // frequência base do ruído (por metro)
uniform float aspereza = 1.0;

varying vec3 mundo_pos;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float ruido(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
			   mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

void vertex() {
	mundo_pos = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
}

void fragment() {
	vec2 w = mundo_pos.xz;
	float n1 = ruido(w * escala);
	float n2 = ruido(w * escala * 3.7);
	float n = n1 * 0.7 + n2 * 0.3;
	vec3 c = mix(cor_terra, cor_grama, smoothstep(0.35, 0.7, n));
	c = mix(c, cor_musgo, smoothstep(0.62, 0.9, n2) * 0.7);
	ALBEDO = c;
	ROUGHNESS = aspereza;
	METALLIC = 0.0;
}
