using Microsoft.EntityFrameworkCore;
using MyMvcProject.Data;
using MyMvcProject.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddMemoryCache();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Seed dữ liệu mẫu thân thiện với trẻ em
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    context.Database.EnsureCreated();
    
    // Ép tạo bảng Students nếu chưa có (vì EnsureCreated không update schema)
    string createTableSql = @"
        CREATE TABLE IF NOT EXISTS ""Students"" (
            ""Id"" SERIAL PRIMARY KEY,
            ""Name"" TEXT NOT NULL,
            ""Stickers"" INTEGER NOT NULL DEFAULT 0,
            ""ClassName"" TEXT NOT NULL DEFAULT 'Lớp 1'
        );";
    context.Database.ExecuteSqlRaw(createTableSql);
    
    if (!context.RewardItems.Any())
    {
        context.RewardItems.AddRange(
            new RewardItem { Name = "Gấu Bông Nhỏ", DropRate = 20 },
            new RewardItem { Name = "Bút Chì Màu", DropRate = 30 },
            new RewardItem { Name = "Sticker Siêu Nhân", DropRate = 30 },
            new RewardItem { Name = "Kẹo Mút Trái Cây", DropRate = 15 },
            new RewardItem { Name = "Ba Lô Siêu Nhân", DropRate = 5 }
        );
        context.SaveChanges();
    }
}

app.UseHttpsRedirection();
app.UseDefaultFiles();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();
app.MapControllers();

// Hỗ trợ PORT env var của Render.com
var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
app.Run($"http://0.0.0.0:{port}");
