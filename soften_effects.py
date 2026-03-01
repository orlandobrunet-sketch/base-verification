import re

# Ler o arquivo index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

print("=== Ajustando efeitos especiais para serem mais sutis ===\n")

# 1. Reduzir opacidade de partículas (de 0.8 para 0.3)
content = re.sub(
    r"particle\.style\.opacity = '0\.8';",
    "particle.style.opacity = '0.3';",
    content
)
print("✓ Opacidade de partículas reduzida: 0.8 → 0.3")

# 2. Reduzir tamanho de partículas (de 8px para 4px)
content = re.sub(
    r"particle\.style\.width = '8px';",
    "particle.style.width = '4px';",
    content
)
content = re.sub(
    r"particle\.style\.height = '8px';",
    "particle.style.height = '4px';",
    content
)
print("✓ Tamanho de partículas reduzido: 8px → 4px")

# 3. Reduzir número de partículas (de 30 para 12)
content = re.sub(
    r"for \(let i = 0; i < 30; i\+\+\)",
    "for (let i = 0; i < 12; i++)",
    content
)
print("✓ Número de partículas reduzido: 30 → 12")

# 4. Aumentar duração de animações (mais lento = mais suave)
# Animação de partículas: 1s → 1.5s
content = re.sub(
    r"particle\.style\.animation = `particleFloat 1s ease-out forwards`;",
    "particle.style.animation = `particleFloat 1.5s ease-out forwards`;",
    content
)
print("✓ Duração de animação de partículas: 1s → 1.5s")

# 5. Reduzir intensidade de brilho em box-shadow
# Procurar por box-shadow com valores altos e reduzir
content = re.sub(
    r"box-shadow: 0 0 30px rgba\(255, 215, 0, 0\.8\)",
    "box-shadow: 0 0 15px rgba(255, 215, 0, 0.4)",
    content
)
content = re.sub(
    r"box-shadow: 0 0 20px rgba\(255, 215, 0, 0\.6\)",
    "box-shadow: 0 0 10px rgba(255, 215, 0, 0.3)",
    content
)
print("✓ Intensidade de brilho (box-shadow) reduzida pela metade")

# 6. Suavizar transições de escala (scale)
content = re.sub(
    r"transform: scale\(1\.1\)",
    "transform: scale(1.05)",
    content
)
content = re.sub(
    r"transform: scale\(1\.2\)",
    "transform: scale(1.08)",
    content
)
print("✓ Efeitos de escala suavizados: 1.1→1.05, 1.2→1.08")

# 7. Reduzir intensidade de glow em text-shadow
content = re.sub(
    r"text-shadow: 0 0 20px rgba\(255, 215, 0, 0\.8\)",
    "text-shadow: 0 0 10px rgba(255, 215, 0, 0.4)",
    content
)
content = re.sub(
    r"text-shadow: 0 0 15px rgba\(255, 215, 0, 0\.6\)",
    "text-shadow: 0 0 8px rgba(255, 215, 0, 0.3)",
    content
)
print("✓ Brilho de texto (text-shadow) reduzido")

# 8. Ajustar animação de pulso (pulse) para ser mais sutil
pulse_animation = """@keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.03); opacity: 0.9; }
        }"""

content = re.sub(
    r"@keyframes pulse \{[^}]+\}",
    pulse_animation,
    content,
    flags=re.DOTALL
)
print("✓ Animação de pulso suavizada: scale(1.05)→scale(1.03)")

# 9. Reduzir blur em filtros
content = re.sub(
    r"filter: blur\(10px\)",
    "filter: blur(5px)",
    content
)
content = re.sub(
    r"filter: blur\(8px\)",
    "filter: blur(4px)",
    content
)
print("✓ Efeitos de blur reduzidos pela metade")

# 10. Ajustar duração de transições gerais
content = re.sub(
    r"transition: all 0\.3s ease",
    "transition: all 0.4s ease",
    content
)
print("✓ Transições gerais suavizadas: 0.3s → 0.4s")

# Salvar o arquivo atualizado
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ Todos os efeitos especiais foram suavizados com sucesso!")
print("   → Animações mais lentas e suaves")
print("   → Brilhos e sombras reduzidos")
print("   → Menos partículas e mais discretas")
print("   → Tom mais profissional mantido")
